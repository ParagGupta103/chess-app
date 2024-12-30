import'./Chessboard.css'
import Tile from '../Tile/Tile'

const horizontalAxis = ['a','b','c','d','e','f','g','h']
const verticalAxis = ['1','2','3','4','5','6','7','8']

interface Piece {
    peice: string;
    x_pos: number;
    y_pos: number;
}

const peices: Piece[] = [];

for(let p = 0; p<2;p++){
    const type = (p===0) ? 'b':'w'; //Checks is p is equal to 0 and assigns 'b' to type and if p is not equal to 0 assigns 'w'
    const y_pos = (p===0) ? 7 : 0;

    peices.push({peice:`assets/images/king_${type}.png`, x_pos:4,y_pos })
    peices.push({peice:`assets/images/queen_${type}.png`, x_pos:3,y_pos })
    peices.push({peice:`assets/images/rook_${type}.png`, x_pos:0,y_pos })
    peices.push({peice:`assets/images/rook_${type}.png`, x_pos:7,y_pos })
    peices.push({peice:`assets/images/knight_${type}.png`, x_pos:1,y_pos })
    peices.push({peice:`assets/images/knight_${type}.png`, x_pos:6,y_pos })
    peices.push({peice:`assets/images/bishop_${type}.png`, x_pos:2,y_pos })
    peices.push({peice:`assets/images/bishop_${type}.png`, x_pos:5,y_pos })

}

for (let i = 0; i<8;i++){
    peices.push({peice:`assets/images/pawn_b.png`, x_pos:i,y_pos:6 })
}
for (let i = 0; i<8;i++){
    peices.push({peice:`assets/images/pawn_w.png`, x_pos:i,y_pos:1 })
}

export default function Chessboard() {
    let board = []
    for (let j = verticalAxis.length - 1; j>=0; j--) {
        for (let i = 0; i < horizontalAxis.length; i++) {
            const pos = i+j+2

            let image = undefined;
            peices.forEach(p =>{
                if (p.x_pos === i && p.y_pos === j){
                    image = p.peice;
                }
            });

            board.push(<Tile key={`${i},${j}`} peice = {image} sqaure={pos}/>);
            
        }
    }
    return <div id='Chessboard'>{board}</div>
}