export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-7 py-16">
      <h1 className="text-3xl font-normal tracking-wide mb-4">
        Reservez votre appel decouverte
      </h1>

      <p className="text-sub text-lg font-light mb-8">
        30 minutes pour faire le point sur votre situation et definir ensemble
        les prochaines etapes.
      </p>

      <div className="border-t border-border my-8" />

      <div className="space-y-4">
        <p className="text-sub font-light">
          Choisissez un creneau qui vous convient et reservez en quelques clics.
          Aucun engagement, aucun frais.
        </p>

        <button
          type="button"
          className="bg-btn-idle hover:bg-btn-hover text-text px-6 py-3 rounded-lg transition-colors font-light"
        >
          Voir les disponibilites
        </button>
      </div>
    </main>
  );
}
