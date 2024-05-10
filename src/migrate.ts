import { Song } from "shared/lib/uge/song/Song";

export const migrateUGE = (song: Song): Song => {
  song.wave_instruments.forEach((instrument) => {
    if (instrument.length !== null) {
      instrument.length = 256 - instrument.length;
    }
  });
  return song;
};
