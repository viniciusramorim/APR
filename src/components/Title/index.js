
import './title.scss';

export default function Title({children, name}){
  return(
    <div className="title">
      {children}
      <div className="name">
      <span>{name}</span>
      </div>
    </div>
  )
}