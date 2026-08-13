/**
 * @typedef {"easy" | "medium" | "hard" | "expert"} Difficulty
 *
 * @typedef {"empty" | "marked" | "queen"} CellState
 *
 * @typedef {Object} Position
 * @property {number} row
 * @property {number} col
 *
 * @typedef {Object} Puzzle
 * @property {string} id
 * @property {number} size
 * @property {Difficulty} difficulty
 * @property {number[][]} regions  - regionMap[row][col] = regionId
 * @property {Position[]} solution - exactly one queen position per row
 *
 * @typedef {CellState[][]} Board
 */

export {};
