import AI from "./ai.js";
import Grid from "./grid.js";
import RandomPieceGenerator from "./random_piece_generator.js";
/*
        P = Population size = 100
        R = Rounds per candidate = 10
        M = Max moves per round = 200
        S = Score per line cleared
        D = Score per piece dropped
        Theoretical fitness limit = (D*M + S*M*4/10)
    */
const PopulationSize = 100;
const RoundsPerCandidate = 10;
const MaxMovesPerRound = 1000;
const ScorePerLineCleared = 10;
const ScorePerPieceDropped = 1;
const FitnessLimit = MaxMovesPerRound * (ScorePerPieceDropped + (ScorePerLineCleared * 4) / 10);
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
function normalize(candidate) {
    let norm = Math.sqrt(candidate.heightWeight * candidate.heightWeight +
        candidate.linesWeight * candidate.linesWeight +
        candidate.holesWeight * candidate.holesWeight +
        candidate.bumpinessWeight * candidate.bumpinessWeight);
    candidate.heightWeight /= norm;
    candidate.linesWeight /= norm;
    candidate.holesWeight /= norm;
    candidate.bumpinessWeight /= norm;
}
function generateRandomCandidate() {
    let candidate = {
        heightWeight: Math.random() - 0.5,
        linesWeight: Math.random() - 0.5,
        holesWeight: Math.random() - 0.5,
        bumpinessWeight: Math.random() - 0.5
    };
    normalize(candidate);
    return candidate;
}
function sort(candidates) {
    candidates.sort(function (a, b) {
        return b.fitness - a.fitness;
    });
}
function computeFitnesses(candidates, numberOfGames, maxNumberOfMoves) {
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const ai = new AI(candidate.heightWeight, candidate.linesWeight, candidate.holesWeight, candidate.bumpinessWeight);
        let totalScore = 0;
        for (let j = 0; j < numberOfGames; j++) {
            const grid = new Grid(22, 10);
            const rpg = new RandomPieceGenerator();
            const workingPieces = [rpg.nextPiece(), rpg.nextPiece()];
            let workingPiece = workingPieces[0];
            let score = 0;
            for (let numberOfMoves = 0; numberOfMoves < maxNumberOfMoves && !grid.exceeded(); numberOfMoves++) {
                workingPiece = ai.best(grid, workingPieces);
                while (workingPiece.moveDown(grid))
                    ;
                grid.addPiece(workingPiece);
                score += ScorePerLineCleared * grid.clearLines() + ScorePerPieceDropped;
                for (let k = 0; k < workingPieces.length - 1; k++) {
                    workingPieces[k] = workingPieces[k + 1];
                }
                workingPieces[workingPieces.length - 1] = rpg.nextPiece();
                workingPiece = workingPieces[0];
            }
            totalScore += score;
        }
        candidate.fitness = totalScore / numberOfGames;
    }
}
function tournamentSelectPair(candidates, ways) {
    let indices = [];
    for (let i = 0; i < candidates.length; i++) {
        indices.push(i);
    }
    /*
              Note that the following assumes that the candidates array is
              sorted according to the fitness of each individual candidates.
              Hence it suffices to pick the least 2 indexes out of the random
              ones picked.
          */
    let fittestCandidateIndex1 = null;
    let fittestCanddiateIndex2 = null;
    for (let i = 0; i < ways; i++) {
        let selectedIndex = indices.splice(randomInteger(0, indices.length), 1)[0];
        if (fittestCandidateIndex1 === null ||
            selectedIndex < fittestCandidateIndex1) {
            fittestCanddiateIndex2 = fittestCandidateIndex1;
            fittestCandidateIndex1 = selectedIndex;
        }
        else if (fittestCanddiateIndex2 === null ||
            selectedIndex < fittestCanddiateIndex2) {
            fittestCanddiateIndex2 = selectedIndex;
        }
    }
    return [
        candidates[fittestCandidateIndex1],
        candidates[fittestCanddiateIndex2]
    ];
}
function crossOver(candidate1, candidate2) {
    let candidate = {
        heightWeight: candidate1.fitness * candidate1.heightWeight +
            candidate2.fitness * candidate2.heightWeight,
        linesWeight: candidate1.fitness * candidate1.linesWeight +
            candidate2.fitness * candidate2.linesWeight,
        holesWeight: candidate1.fitness * candidate1.holesWeight +
            candidate2.fitness * candidate2.holesWeight,
        bumpinessWeight: candidate1.fitness * candidate1.bumpinessWeight +
            candidate2.fitness * candidate2.bumpinessWeight
    };
    normalize(candidate);
    return candidate;
}
function mutate(candidate) {
    let quantity = Math.random() * 0.4 - 0.2; // plus/minus 0.2
    switch (randomInteger(0, 4)) {
        case 0:
            candidate.heightWeight += quantity;
            break;
        case 1:
            candidate.linesWeight += quantity;
            break;
        case 2:
            candidate.holesWeight += quantity;
            break;
        case 3:
            candidate.bumpinessWeight += quantity;
            break;
    }
}
function deleteNLastReplacement(candidates, newCandidates) {
    candidates.splice(-newCandidates.length);
    for (let i = 0; i < newCandidates.length; i++) {
        candidates.push(newCandidates[i]);
    }
    sort(candidates);
}
export default function tune() {
    let candidates = [];
    // Initial population generation
    for (let i = 0; i < PopulationSize; i++) {
        candidates.push(generateRandomCandidate());
    }
    console.log("Computing fitnesses of initial population...");
    computeFitnesses(candidates, RoundsPerCandidate, MaxMovesPerRound);
    sort(candidates);
    let count = 0;
    const P30 = 0.3 * PopulationSize;
    const P10 = 0.1 * PopulationSize;
    while (true) {
        let newCandidates = [];
        for (let i = 0; i < P30; i++) {
            // 30% of population
            let pair = tournamentSelectPair(candidates, P10); // 10% of population
            //console.log('fitnesses = ' + pair[0].fitness + ',' + pair[1].fitness);
            let candidate = crossOver(pair[0], pair[1]);
            if (Math.random() < 0.05) {
                // 5% chance of mutation
                mutate(candidate);
            }
            normalize(candidate);
            newCandidates.push(candidate);
        }
        console.log("Computing fitnesses of new candidates. (" + count + ")");
        computeFitnesses(newCandidates, RoundsPerCandidate, MaxMovesPerRound);
        deleteNLastReplacement(candidates, newCandidates);
        let totalFitness = 0;
        for (let i = 0; i < candidates.length; i++) {
            totalFitness += candidates[i].fitness;
        }
        console.log("Average fitness =", totalFitness / candidates.length / FitnessLimit);
        console.log("Highest fitness =", candidates[0].fitness / FitnessLimit);
        console.log("Fittest candidate = " + JSON.stringify(candidates[0]) + "(" + count + ")");
        count++;
        if (count % 4 == 0) {
            // recompute every fitness
            console.log("Recompute");
            computeFitnesses(candidates, RoundsPerCandidate, MaxMovesPerRound);
            sort(candidates);
            console.log("Highest fitness =", candidates[0].fitness / FitnessLimit);
        }
    }
}
tune();
