
import os

def update_env_file():
    env_path = '.env'

    # New values from user
    new_values = {
        "SUPABASE_URL": "https://rwpmtuohcvnciemtsjge.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww",
        "SUPABASE_JWT_SECRET": "FY/5k4SlFBGJuki8iRJxtX0WAo7XC8tqpz+7ZPk56PmQXMFJvlY/vRWfU+uqzYjPUyA7kIRo5a9w/MsYmzibtA==",
        "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_OT6bpALKJi8q1SaU_caXBA_G4bSjdx4",
        "SUPABASE_SECRET_KEY": "sb_secret_Q53mcFxZ5DaEA9xbww9SCg_lBO6Y3wl"
    }

    lines = []
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception:
            # Fallback if still failing reading utf8, try reading raw binary and decoding latin1
            with open(env_path, 'rb') as f:
                content = f.read()
                lines = content.decode('latin-1').splitlines(keepends=True)

    # Dictionary to track what we have found
    found_keys = set()
    output_lines = []

    for line in lines:
        line_stripped = line.strip()
        if not line_stripped or line_stripped.startswith('#'):
            output_lines.append(line)
            continue

        # Parse key
        if '=' in line_stripped:
            key = line_stripped.split('=', 1)[0].strip()
            if key in new_values:
                # Update this line
                output_lines.append(f"{key}={new_values[key]}\n")
                found_keys.add(key)
            else:
                output_lines.append(line)
        else:
            output_lines.append(line)

    # Append missing keys
    output_lines.append("\n# Added by Assistant\n")
    for k, v in new_values.items():
        if k not in found_keys:
            output_lines.append(f"{k}={v}\n")

    # Write back locally (in CWD which is project root)
    # AND also to backend/.env if it exists there separately (Step 24 showed .env in backend/)
    # Actually wait, Step 4 showed .env in ROOT, Step 24 showed .env in backend/
    # I should update BOTH.

    files_to_update = ['.env', 'backend/.env']

    for fname in files_to_update:
        if os.path.exists(os.path.dirname(fname) or '.'):
             print(f"Updating {fname}...")
             try:
                 with open(fname, 'w', encoding='utf-8') as f:
                     f.writelines(output_lines)
                 print(f"✅ Updated {fname}")
             except Exception as e:
                 print(f"❌ Failed to update {fname}: {e}")

if __name__ == "__main__":
    update_env_file()
