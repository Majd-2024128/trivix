export const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-primary tracking-widest uppercase mb-6 animate-fade-up">
          Welcome to the future
        </p>
        <h1 className="font-display text-5xl md:text-7xl text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Build something{" "}
          <span className="text-primary">remarkable</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          A beautifully crafted platform that helps you turn bold ideas into reality. Simple, powerful, and designed with intention.
        </p>
        <div className="flex items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <button className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Start Building
          </button>
          <button className="bg-secondary text-secondary-foreground font-medium px-8 py-3 rounded-lg hover:bg-secondary/80 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};
