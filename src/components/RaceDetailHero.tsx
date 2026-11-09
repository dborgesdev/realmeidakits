import { asset } from "../data/assets";
import type { Race } from "../types/domain";
import RaceImage from "./RaceImage";
export default function RaceDetailHero({ race }: { race: Race }) {
  return (
    <section className="race-hero">
      {race.image && <RaceImage src={asset(race.image)} alt="" />}
      <div>
        <span className="eyebrow">CORRIDAS</span>
        <h1>{race.name}</h1>
        <p>{race.description}</p>
      </div>
    </section>
  );
}
