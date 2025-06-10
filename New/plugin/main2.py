import subprocess
import os
import time
import signal

photoshop_path = r"C:\Program Files\Adobe\Adobe Photoshop 2025\Photoshop.exe"
jsx_script_path = r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\plugin\action2.jsx"

def close_photoshop():
    print("🛑 Closing Photoshop...")
    subprocess.call(['taskkill', '/f', '/im', 'Photoshop.exe'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

try:
    if os.path.exists(photoshop_path) and os.path.exists(jsx_script_path):
        ps_process = subprocess.Popen([photoshop_path, "-r", jsx_script_path])
        print("✅ Photoshop launched with script.")

        print("⏳ Waiting for Photoshop to finish... (Press CTRL+C to interrupt)")
        while ps_process.poll() is None:
            time.sleep(1)

    else:
        print("❌ Photoshop or script not found.")

except KeyboardInterrupt:
    print("\n⛔ Script interrupted by user.")

finally:
    close_photoshop()
    print("✅ Photoshop closed.")
