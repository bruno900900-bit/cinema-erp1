
import os
import shutil

def fix_encoding():
    env_path = '.env'
    if not os.path.exists(env_path):
        print(f"File {env_path} not found.")
        return

    # Backup
    shutil.copy(env_path, env_path + '.bak')
    print(f"Backed up {env_path} to {env_path}.bak")

    content = None
    encodings = ['utf-8', 'cp1252', 'latin-1', 'iso-8859-1']

    for enc in encodings:
        try:
            print(f"Trying to read with {enc}...")
            with open(env_path, 'r', encoding=enc) as f:
                content = f.read()
            print(f"✅ Success reading with {enc}")
            break
        except UnicodeDecodeError:
            print(f"❌ Failed with {enc}")
            continue

    if content is None:
        print("Could not read file with standard encodings.")
        return

    # Check for the specific byte 0xE7 (ç)
    if 'ç' in content:
        print("Found character 'ç' in the file.")

    # Write back as utf-8
    try:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Re-wrote {env_path} as UTF-8.")
    except Exception as e:
        print(f"❌ Failed to write file: {e}")

if __name__ == "__main__":
    fix_encoding()
