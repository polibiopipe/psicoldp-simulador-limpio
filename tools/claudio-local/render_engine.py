"""Kokoro + Wav2Lip/OpenVINO, retained in memory for the local academic pilot."""
from pathlib import Path
import math
import subprocess
import sys


class LocalAvatarEngine:
    def __init__(self, root, device='CPU'):
        import cv2
        import numpy as np
        import onnxruntime as ort
        import openvino as ov
        from kokoro_onnx import Kokoro

        self.root = Path(root)
        sys.path.insert(0, str(self.root / 'Wav2Lip'))
        self.np, self.cv2 = np, cv2
        options = ort.SessionOptions()
        options.intra_op_num_threads = 4
        options.inter_op_num_threads = 1
        self.tts = ort.InferenceSession(str(self.root / 'models/kokoro-v1.0.onnx'),
            sess_options=options, providers=['CPUExecutionProvider'])
        self.voice = Kokoro.from_session(self.tts, str(self.root / 'models/voices-v1.0.bin'))
        path = self.root / 'models/wav2lip_gan.xml'
        if not path.exists():
            import torch
            from models import Wav2Lip
            torch.set_num_threads(4)
            model = Wav2Lip().eval()
            state = torch.load(self.root / 'models/wav2lip_gan.pth', map_location='cpu', weights_only=True)
            model.load_state_dict({k.removeprefix('module.'): v for k, v in state['state_dict'].items()})
            converted = ov.convert_model(model, example_input={
                'audio_sequences': torch.zeros(1, 1, 80, 16),
                'face_sequences': torch.zeros(1, 6, 96, 96)})
            converted.reshape({'audio_sequences': [-1, 1, 80, 16], 'face_sequences': [-1, 6, 96, 96]})
            ov.save_model(converted, path)
            del model, state, converted
        core = ov.Core()
        self.compiled = core.compile_model(path, device, {'PERFORMANCE_HINT': 'LATENCY'})
        self.devices = list(self.compiled.get_property('EXECUTION_DEVICES'))
        original = cv2.imread(str(self.root / 'claudio.png'))
        if original is None or original.shape[:2] != (1448, 1086):
            raise ValueError('Falta el retrato original de Claudio.')
        self.frame = cv2.resize(original, (576, 768), interpolation=cv2.INTER_AREA)
        self.coords = [round(v * 576 / 1086) for v in (335, 208, 759, 728)]
        x1, y1, x2, y2 = self.coords
        self.face = self.frame[y1:y2, x1:x2]
        small = cv2.resize(self.face, (96, 96))
        masked = small.copy()
        masked[48:] = 0
        self.face_input = np.concatenate([masked, small], axis=2).transpose(2, 0, 1).astype(np.float32) / 255
        height, width = self.face.shape[:2]
        yy, xx = np.mgrid[:height, :width].astype(np.float32)
        vertical = np.clip((yy / height - .53) / .11, 0, 1) * np.clip((1 - yy / height) / .1, 0, 1)
        horizontal = np.minimum(np.clip(xx / width / .14, 0, 1), np.clip((1 - xx / width) / .14, 0, 1))
        self.blend = (vertical * horizontal)[..., None]

    def render(self, text, directory):
        import librosa
        import soundfile as sf
        import imageio_ffmpeg
        import audio as wav2lip_audio
        from hparams import hparams as hp

        np, cv2 = self.np, self.cv2
        directory = Path(directory)
        audio_parts = []
        # Split at words without dropping or inventing any part of the answer.
        words = text.split()
        chunks, current = [], []
        for word in words:
            if len(' '.join([*current, word])) > 220 and current:
                chunks.append(' '.join(current))
                current = []
            current.append(word)
        if current:
            chunks.append(' '.join(current))
        for chunk in chunks:
            phonemes = self.voice.tokenizer.phonemize(chunk, 'es')
            tokens = self.voice.tokenizer.tokenize(phonemes)
            if not 0 < len(tokens) < 510:
                raise ValueError('No fue posible pronunciar esta respuesta completa.')
            inputs = {'input_ids': np.asarray([[0, *tokens, 0]], dtype=np.int64),
                'style': np.asarray(self.voice.get_voice_style('em_alex')[len(tokens)], dtype=np.float32),
                'speed': np.asarray([.95], dtype=np.float32)}
            audio_parts.append(np.asarray(self.tts.run(None, inputs)[0]).reshape(-1))
            audio_parts.append(np.zeros(3600, dtype=np.float32))
        samples = np.concatenate([np.zeros(6000), *audio_parts, np.zeros(3600)])
        wav_path = directory / 'answer.wav'
        sf.write(wav_path, samples, 24000, subtype='PCM_16')
        wav2lip_audio._mel_basis = librosa.filters.mel(sr=hp.sample_rate, n_fft=hp.n_fft,
            n_mels=hp.num_mels, fmin=hp.fmin, fmax=hp.fmax)
        mel = wav2lip_audio.melspectrogram(librosa.load(wav_path, sr=16000)[0])
        if not np.isfinite(mel).all():
            raise ValueError('No fue posible sincronizar este audio.')
        fps, batch = 25, 4
        count = math.ceil(len(samples) / 24000 * fps)
        mel = np.pad(mel, ((0, 0), (0, 16)), mode='edge')
        video_path = directory / 'answer.mp4'
        process = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '576x768', '-r', str(fps), '-i', '-',
            '-i', str(wav_path), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart',
            str(video_path)], stdin=subprocess.PIPE)
        x1, y1, x2, y2 = self.coords
        try:
            for start in range(0, count, batch):
                indices = range(start, min(start + batch, count))
                parts = [mel[:, int(i * 80 / fps):int(i * 80 / fps) + 16] for i in indices]
                prediction = self.compiled({
                    'audio_sequences': np.asarray(parts, dtype=np.float32)[:, None],
                    'face_sequences': np.repeat(self.face_input[None], len(parts), axis=0)})[0]
                for generated in prediction:
                    patch = cv2.resize((generated.transpose(1, 2, 0) * 255).clip(0, 255).astype(np.uint8), (x2 - x1, y2 - y1))
                    frame = self.frame.copy()
                    frame[y1:y2, x1:x2] = (patch * self.blend + self.face * (1 - self.blend)).astype(np.uint8)
                    process.stdin.write(frame.tobytes())
            process.stdin.close()
            if process.wait(timeout=30) != 0:
                raise RuntimeError('No se pudo completar el vídeo.')
        except BaseException:
            process.kill()
            process.wait()
            raise
        return video_path.read_bytes()
