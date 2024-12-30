import './Tile.css'

interface Props {
    sqaure : number;
    peice?: string;

}
export default function Tile({sqaure,peice}: Props){
    if (sqaure%2 === 0){
        return <div className='tile black-tile'>
            <img src={peice} />
        </div>
    }
    else{
        return <div className='tile white-tile'>
            <img src={peice} />
        </div>
    }
}