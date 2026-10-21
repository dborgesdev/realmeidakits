import { asset } from "../data/events";
import type { Race } from "../types/domain";
export default function RaceDetailHero({ race }: { race: Race }) {
  return (
    <section className="race-hero">
      <img src={asset(race.image)} alt="" />
      <div>
        <span className="eyebrow">EVENTO DE DEMONSTRAÇÃO</span>
        <h1>{race.name}</h1>
        <p>{race.description}</p>
      </div>
    </section>
  );
}
