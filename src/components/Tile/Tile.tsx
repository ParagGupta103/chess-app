import './Tile.css'

interface Props {
    square : number;
    image?: string;

}

// "assets/images/king_w.png" -> "white king"
function pieceName(image: string){
    const [type, colour] = image.split('/').pop()!.replace('.png','').split('_');
    return `${colour === 'w' ? 'white' : 'black'} ${type}`;
}

export default function Tile({square,image}: Props){
    const colour = (square%2 === 0) ? 'black-tile' : 'white-tile';
    return <div className={`tile ${colour}`}>
        {image && <img src={image} alt={pieceName(image)} />}
    </div>
}
