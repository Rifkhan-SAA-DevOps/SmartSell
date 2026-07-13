export default function CategoryCard({ item }) {
  return (
    <article className={`category-card glow-${item.gradient}`}>
      <span className="category-icon">{item.icon}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </article>
  );
}
