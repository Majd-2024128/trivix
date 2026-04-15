import { Zap, Shield, Palette } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed at every layer. Your users will feel the difference instantly.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security built in from day one. No compromises.",
  },
  {
    icon: Palette,
    title: "Beautiful Design",
    description: "Crafted with care and attention to every pixel. Design that delights.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-16">
          Why you'll love it
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-colors"
            >
              <feature.icon className="w-10 h-10 text-primary mb-5" />
              <h3 className="font-display text-xl text-card-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
