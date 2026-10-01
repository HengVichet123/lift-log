# Lift Log

A phone app (PWA) for recording workouts with pictures: pick an exercise by photo, save sets with big +/- buttons, and see your progress. English by default, Khmer optional for navigation.

Workouts are stored only on the phone (IndexedDB).

## Develop

```
npm install
npm run dev
```

`python3 scripts/prepare_data.py` rebuilds `src/data/exercises.json` and the offline starter photos in `public/ex/`.

## Credits

Exercise data and photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).
