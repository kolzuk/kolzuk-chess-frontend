
import { useState, useEffect } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessEngine() {
    const [game, setGame] = useState(() => new Chess());
    const [isComputersTurn, setIsComputersTurn] = useState(false);
    const [computerPossibleMoves, setComputerPossibleMoves] = useState<string[]>([]);

    function makeAMove(move: string | {from: string, to: string, promotion?: string}) {
        if (game.isGameOver())
            alert("game over");
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move(move);
        if (result) setGame(gameCopy);
        return result;
    }

    async function makeComputerMove() {
        const possibleMoves = game.moves();
        if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) {
            setIsComputersTurn(false);
            return;
        }

        const response = await fetch('http://localhost/api/best-move', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fen: game.fen(),
                depth: 5,
            }),
        });

        if (!response.ok) {
            console.error('Ошибка при запросе лучшего хода');
            setIsComputersTurn(false);
            return;
        }

        const data = await response.json();
        const bestMoves = data.moves;
        setComputerPossibleMoves(bestMoves);
        const randomIndex = Math.floor(Math.random() * bestMoves.length);
        const bestMove = bestMoves[randomIndex];

        if (bestMove) {
            makeAMove(bestMove);
            setIsComputersTurn(false);
        } else {
            console.error('Сервер не вернул ход');
        }
    }

    // Проверка: может ли игрок сейчас ходить за белых
    function onDrop(sourceSquare: Square, targetSquare: Square) {
        // Разрешаем игроку ходить только если сейчас ход белых
        if (isComputersTurn) return false;
        if (game.turn() !== "w") return false; // только если очередь белых

        const move = makeAMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });

        if (move === null) return false; // нелегальный ход

        setIsComputersTurn(true);
        return true;
    }

    // Ход компьютера автоматически после хода белых
    useEffect(() => {
        if (isComputersTurn && !game.isGameOver() && game.turn() === "b") {
            setTimeout(makeComputerMove, 300);
        }
        // eslint-disable-next-line
    }, [isComputersTurn, game]);

    return (
        <div><Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            autoPromoteToQueen={true}
            boardOrientation="white"
            boardWidth={700}/>
            <h1>Current FEN: {game.fen()}</h1>
            <h2>Got last moves: {computerPossibleMoves.toString()}</h2>
        </div>
    );
}
