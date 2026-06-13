"""Generate MP3 audio files for all kana and words using Edge TTS (ja-JP-NanamiNeural)."""
import asyncio
import os
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
VOICE = 'ja-JP-NanamiNeural'

# Mirror src/data/kanaData.ts — hiragana and romaji for all 46 kana
KANA = [
    ('あ', 'a'), ('い', 'i'), ('う', 'u'), ('え', 'e'), ('お', 'o'),
    ('か', 'ka'), ('き', 'ki'), ('く', 'ku'), ('け', 'ke'), ('こ', 'ko'),
    ('さ', 'sa'), ('し', 'shi'), ('す', 'su'), ('せ', 'se'), ('そ', 'so'),
    ('た', 'ta'), ('ち', 'chi'), ('つ', 'tsu'), ('て', 'te'), ('と', 'to'),
    ('な', 'na'), ('に', 'ni'), ('ぬ', 'nu'), ('ね', 'ne'), ('の', 'no'),
    ('は', 'ha'), ('ひ', 'hi'), ('ふ', 'fu'), ('へ', 'he'), ('ほ', 'ho'),
    ('ま', 'ma'), ('み', 'mi'), ('む', 'mu'), ('め', 'me'), ('も', 'mo'),
    ('や', 'ya'), ('ゆ', 'yu'), ('よ', 'yo'),
    ('ら', 'ra'), ('り', 'ri'), ('る', 'ru'), ('れ', 're'), ('ろ', 'ro'),
    ('わ', 'wa'), ('を', 'wo'),
    ('ん', 'n'),
]

# Mirror src/data/wordData.ts — kana readings for all 28 words
WORDS = [
    'いえ', 'くるま', 'さかな', 'ねこ', 'いぬ', 'やま', 'みず',
    'さくら', 'はな', 'そら', 'かわ', 'つき', 'ほし', 'ひと',
    'こども', 'がっこう', 'えき', 'ほん', 'てがみ', 'でんわ',
    'ともだち', 'ありがとう', 'こんにちは', 'おはよう',
    'こんばんは', 'すみません', 'さようなら', 'はじめまして',
]


async def generate_one(text: str, filename: str) -> None:
    path = os.path.join(OUTPUT_DIR, filename)
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(path)
    print(f'  OK {filename}')


async def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f'Generating {len(KANA)} kana audio files...')
    for hiragana, romaji in KANA:
        await generate_one(hiragana, f'{romaji}.mp3')

    print(f'Generating {len(WORDS)} word audio files...')
    for i, word in enumerate(WORDS):
        await generate_one(word, f'w_{i}.mp3')

    print(f'\nDone! {len(KANA) + len(WORDS)} files written to {OUTPUT_DIR}')


if __name__ == '__main__':
    asyncio.run(main())
