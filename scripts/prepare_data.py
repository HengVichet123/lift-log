"""Build src/data/exercises.json from free-exercise-db (Unlicense) and download
photos for the starter set into public/ex/ so they work offline.
Run: python3 scripts/prepare_data.py"""
import json, os, urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

GROUP = {
    "chest": "chest",
    "lats": "back", "middle back": "back", "lower back": "back", "traps": "back", "neck": "back",
    "quadriceps": "legs", "hamstrings": "legs", "glutes": "legs", "calves": "legs",
    "adductors": "legs", "abductors": "legs",
    "shoulders": "shoulders",
    "biceps": "arms", "triceps": "arms", "forearms": "arms",
    "abdominals": "core",
}

STARTER = """Barbell_Bench_Press_-_Medium_Grip Dumbbell_Bench_Press Incline_Dumbbell_Press Pushups
Dips_-_Chest_Version Dumbbell_Flyes Cable_Crossover Butterfly
Pullups Chin-Up Wide-Grip_Lat_Pulldown Bent_Over_Barbell_Row One-Arm_Dumbbell_Row Seated_Cable_Rows
Barbell_Deadlift Hyperextensions_Back_Extensions Barbell_Shrug
Barbell_Squat Leg_Press Goblet_Squat Dumbbell_Lunges Romanian_Deadlift Lying_Leg_Curls Leg_Extensions
Barbell_Hip_Thrust Standing_Calf_Raises
Standing_Military_Press Dumbbell_Shoulder_Press Side_Lateral_Raise Front_Dumbbell_Raise Reverse_Flyes Face_Pull
Barbell_Curl Dumbbell_Bicep_Curl Hammer_Curls Triceps_Pushdown Lying_Triceps_Press Dips_-_Triceps_Version
Standing_Dumbbell_Triceps_Extension
Crunches Plank Hanging_Leg_Raise Russian_Twist Ab_Roller Cable_Crunch""".split()

src = json.load(open(os.path.join(ROOT, "scripts", "free-exercise-db.json")))
out = []
for e in src:
    if e.get("category") not in ("strength", "powerlifting", "olympic weightlifting", "plyometrics", "strongman"):
        continue
    if not e.get("images"):
        continue
    g = GROUP.get((e.get("primaryMuscles") or [""])[0])
    if not g:
        continue
    out.append({
        "id": e["id"],
        "name": e["name"],
        "group": g,
        "equipment": e.get("equipment") or "other",
        "frames": len(e["images"][:2]),
        "starter": e["id"] in STARTER,
    })

ids = {e["id"] for e in out}
missing = [s for s in STARTER if s not in ids]
assert not missing, missing
# starter set first, in the curated order
order = {s: i for i, s in enumerate(STARTER)}
out.sort(key=lambda e: (order.get(e["id"], 10_000), e["name"]))

os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
with open(os.path.join(ROOT, "src", "data", "exercises.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"), ensure_ascii=False)

for s in STARTER:
    d = os.path.join(ROOT, "public", "ex", s)
    os.makedirs(d, exist_ok=True)
    for i in range(2):
        webp = os.path.join(d, f"{i}.webp")
        if os.path.exists(webp):
            continue
        jpg = os.path.join(d, f"{i}.jpg")
        urllib.request.urlretrieve(f"{RAW}{s}/{i}.jpg", jpg)
        im = Image.open(jpg).convert("RGB")
        im.thumbnail((480, 480))
        im.save(webp, "WEBP", quality=72)
        os.remove(jpg)
print(len(out), "exercises,", len(STARTER), "starter downloaded")
