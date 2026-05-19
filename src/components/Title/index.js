import "./title.scss";

export default function Title({ children, name, subtitle }) {
  return (
    <div className="title-page">
      <div className="name">
        <span>{name}</span>
      </div>
      <div className="subtitle">
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
