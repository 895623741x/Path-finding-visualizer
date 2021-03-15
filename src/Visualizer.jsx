import React, { Component } from "react";
import { Navbar, NavDropdown, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Node from "./Node";
import "./Visualizer.css";
import { AStar } from "./algorithms/aStar";
import { bfs } from "./algorithms/bfs";
import { dfs } from "./algorithms/dfs";
import { dijkstra } from "./algorithms/dijkstra";

export default class PathfindingVisualizer extends Component {
	constructor() {
		super();
		this.state = {
			grid: [],
			START_NODE_ROW: 5,
			FINISH_NODE_ROW: 5,
			START_NODE_COL: 5,
			FINISH_NODE_COL: 15,
			mouseIsPressed: false,
			ROW_AMOUNT: 25,
			COLUMN_AMOUNT: 35,
			MOBILE_ROW_COUNT: 10,
			MOBILE_COLUMN_COUNT: 20,
			isRunning: false,
			isStartNode: false,
			isFinishNode: false,
			isWallNode: false, // xxxxxxx
			currentRow: 0,
			currentCol: 0,
			isDesktopView: true,
			currentAlgorithm: "dijkstra",
			animationSpeed: 1,
		};

		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.toggleIsRunning = this.toggleIsRunning.bind(this);
	}

	componentDidMount() {
		const initialGrid = this.getInitialGrid();
		this.setState({ grid: initialGrid });
	}

	toggleIsRunning() {
		this.setState({ isRunning: !this.state.isRunning });
	}

	//initialize the grid

	getInitialGrid = (rowAmount = this.state.ROW_AMOUNT, colAmount = this.state.COLUMN_AMOUNT) => {
		const initialGrid = [];
		for (let r = 0; r < rowAmount; r++) {
			const currentRow = [];
			for (let c = 0; c < colAmount; c++) {
				currentRow.push(this.createNode(r, c));
			}
			initialGrid.push(currentRow);
		}
		return initialGrid;
	};

	// create nodes

	createNode = (row, col) => {
		return {
			row,
			col,
			isStart: row === this.state.START_NODE_ROW && col === this.state.START_NODE_COL,
			isFinish: row === this.state.FINISH_NODE_ROW && col === this.state.FINISH_NODE_COL,
			distance: Infinity,
			distanceToFinishNode: Math.abs(this.state.FINISH_NODE_ROW - row) + Math.abs(this.state.FINISH_NODE_COL - col),
			isVisited: false,
			isWall: false,
			previousNode: null,
			isNode: true,
		};
	};

	// mouse and event handlers, we separate a click into three status: mouse down, mouse enter and mouse leave

	handleMouseDown = (row, col) => {
		// check if the board is being run
		if (!this.state.isRunning) {
			//check if the grid is cleared
			if (this.isGridCleared()) {
				// we check if the node that is clicked is a start node, if it is a start node, we said it is a start node and is clicked by the mouse
				if (document.getElementById(`node-${row}-${col}`).className === "node node-start") {
					this.setState({ isStartNode: true, mouseIsPressed: true, currentRow: row, currentCol: col });
				} // we check if the node that is clicked is a finish node, if it is a start node, we said it is a finish node and is clicked by the mouse
				else if (document.getElementById(`node-${row}-${col}`).className === "node node-finish") {
					this.setState({ isFinishNode: true, mouseIsPressed: true, currentRow: row, currentCol: col });
				} // if the node that is clicked is neither a start node nor a finish node, we set it to a wall node or cancel its wall if it is already a wall node and finally update the grid
				else {
					const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
					this.setState({ grid: newGrid, isWallNode: true, mouseIsPressed: true, currentRow: row, currentCol: col });
				}
			}
		}
	};

	// if the name of the node is not visited or shotest path, we cleared the grid
	isGridCleared = () => {
		for (const row of this.state.grid) {
			for (const node of row) {
				const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).className;
				if (nodeClassName === "node node-visited" || nodeClassName === "node node-shortest-path") {
					return false;
				}
			}
		}
		return true;
	};

	handleMouseEnter(row, col) {
		// check if the board is being run
		if (!this.state.isRunning) {
			// if the board is not run, check if the mouse is pressed
			if (this.state.mouseIsPressed) {
				// if the mouse is pressed, we get the className of the node on the given row and column
				const nodeClassName = document.getElementById(`node-${row}-${col}`).className;
				// then we check if the node on the given row and the column is a start node
				if (this.state.isStartNode) {
					// if the node is a start node, we check if the node is a wall node
					if (nodeClassName !== "node node-wall") {
						// make the current node we are at a previous start node and move on to the given row and column and set the node to be the current start node
						const prevStartNode = this.state.grid[this.state.currentRow][this.state.currentCol];
						prevStartNode.isStart = false;
						document.getElementById(`node-${this.state.currentRow}-${this.state.currentCol}`).className = "node";

						this.setState({ currentRow: row, currentCol: col });
						const currentStartNode = this.state.grid[row][col];
						currentStartNode.isStart = true;
						document.getElementById(`node-${row}-${col}`).className = "node node-start";
						console.log("good");
					}
					this.setState({ START_NODE_ROW: row, START_NODE_COL: col });
				} //if the node on the given row and column is not a start node, we check if the node is a finish node
				else if (this.state.isFinishNode) {
					// again we check if the node is a wall node when the node is a finish node
					if (nodeClassName !== "node node-wall") {
						// make the current node we are at a previous finish node and move on to the given row and column and set the node to be the current finish node
						const prevFinishNode = this.state.grid[this.state.currentRow][this.state.currentCol];
						prevFinishNode.isFinish = false;
						document.getElementById(`node-${this.state.currentRow}-${this.state.currentCol}`).className = "node";

						this.setState({ currentRow: row, currentCol: col });
						const currentFinishNode = this.state.grid[row][col];
						currentFinishNode.isFinish = true;
						document.getElementById(`node-${row}-${col}`).className = "node node-finish";
					}
					this.setState({ FINISH_NODE_ROW: row, FINISH_NODE_COL: col });
				} // we check if the node is a wall node if it is neither a start node nor a finish node
				else if (this.state.isWallNode) {
					// Since it is a wall node, we cancel the wall node if we click the node, then we update the grid
					const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
					this.setState({ grid: newGrid });
				}
			}
		}
	}

	handleMouseUp(row, col) {
		if (!this.state.isRunning) {
			// mouse is not pressed, but not yet leaves
			this.setState({ mouseIsPressed: false });
			if (this.state.isStartNode) {
				// update the current start node when the click is finished
				const isStartNode = !this.state.isStartNode;
				this.setState({ isStartNode, START_NODE_ROW: row, START_NODE_COL: col });
			} else if (this.state.isFinishNode) {
				// update the current finish node when the click is finished
				const isFinishNode = !this.state.isFinishNode;
				this.setState({
					isFinishNode,
					FINISH_NODE_ROW: row,
					FINISH_NODE_COL: col,
				});
			}
			this.getInitialGrid();
		}
	}

	handleMouseLeave() {
		if (this.state.isStartNode) {
			const isStartNode = !this.state.isStartNode;
			this.setState({ isStartNode, mouseIsPressed: false });
		} else if (this.state.isFinishNode) {
			const isFinishNode = !this.state.isFinishNode;
			this.setState({ isFinishNode, mouseIsPressed: false });
		} else if (this.state.isWallNode) {
			const isWallNode = !this.state.isWallNode;
			this.setState({ isWallNode, mouseIsPressed: false });
			this.getInitialGrid();
		}
	}

	// clear the nodes that have been animated and walls

	clearGrid() {
		if (!this.state.isRunning) {
			const newGrid = [...this.state.grid];
			for (const row of newGrid) {
				for (const node of row) {
					let nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).className;
					if (
						nodeClassName !== "node node-start" &&
						nodeClassName !== "node node-finish" &&
						nodeClassName !== "node node-wall"
					) {
						// if the node is neither a start node, nor a finish node, nor a wall node, we reset the status of visited, distance and the distance to finish node
						document.getElementById(`node-${node.row}-${node.col}`).className = "node";
						node.isVisited = false;
						node.distance = Infinity;
						node.distanceToFinishNode =
							Math.abs(this.state.FINISH_NODE_ROW - node.row) + Math.abs(this.state.FINISH_NODE_COL - node.col);
					}
					if (nodeClassName === "node node-finish") {
						node.isVisited = false;
						node.distance = Infinity;
						node.distanceToFinishNode = 0;
					}
					if (nodeClassName === "node node-start") {
						node.isVisited = false;
						node.distance = Infinity;
						node.distanceToFinishNode =
							Math.abs(this.state.FINISH_NODE_ROW - node.row) + Math.abs(this.state.FINISH_NODE_COL - node.col);
						node.isStart = true;
						node.isWall = false;
						node.previousNode = null;
						node.isNode = true;
					}
				}
			}
		}
	}

	clearWalls() {
		if (!this.state.isRunning) {
			const newGrid = [...this.state.grid];
			for (const row of newGrid) {
				for (const node of row) {
					const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).className;
					if (nodeClassName === "node node-wall") {
						document.getElementById(`node-${node.row}-${node.col}`).className = "node";
						node.isWall = false;
					}
				}
			}
		}
	}

	// visualize the chosen algorithm and animate it
	visualize(algo) {
		if (!this.state.isRunning) {
			this.clearGrid();
			this.toggleIsRunning();
			const grid = this.state.grid;
			const startNode = grid[this.state.START_NODE_ROW][this.state.START_NODE_COL];
			const finishNode = grid[this.state.FINISH_NODE_ROW][this.state.FINISH_NODE_COL];
			let visitedNodesInOrder;
			switch (algo) {
				case "dijkstra":
					visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
					break;
				case "a*":
					visitedNodesInOrder = AStar(grid, startNode, finishNode);
					break;
				case "bredth first search":
					visitedNodesInOrder = bfs(grid, startNode, finishNode);
					break;
				case "depth first search":
					visitedNodesInOrder = dfs(grid, startNode, finishNode);
					break;
				default:
					// should never get here

					break;
			}
			const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
			nodesInShortestPathOrder.push("end");
			this.animate(visitedNodesInOrder, nodesInShortestPathOrder);
		}
	}

	// animate the process of path finding and display the shortest path after the process
	animate(visitedNodesInOrder, nodesInShortestPathOrder) {
		for (let i = 0; i <= visitedNodesInOrder.length; i++) {
			// when i === visitedNodesInOrder.length, this means we have reached the finish node
			// so we animate the shortest path
			if (i === visitedNodesInOrder.length) {
				setTimeout(() => {
					this.animateShortestPath(nodesInShortestPathOrder);
				}, (10 * i) / this.state.animationSpeed);
				return;
			}
			setTimeout(() => {
				const node = visitedNodesInOrder[i];
				const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).className;
				if (nodeClassName !== "node node-start" && nodeClassName !== "node node-finish") {
					document.getElementById(`node-${node.row}-${node.col}`).className = "node node-visited";
				}
			}, (10 * i) / this.state.animationSpeed);
		}
	}

	animateShortestPath(nodesInShortestPathOrder) {
		for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
			if (nodesInShortestPathOrder[i] === "end") {
				setTimeout(() => {
					this.toggleIsRunning();
				}, (i * 50) / this.state.animationSpeed);
			} else {
				setTimeout(() => {
					const node = nodesInShortestPathOrder[i];
					const nodeClassName = document.getElementById(`node-${node.row}-${node.col}`).className;
					if (nodeClassName !== "node node-start" && nodeClassName !== "node node-finish") {
						document.getElementById(`node-${node.row}-${node.col}`).className = "node node-shortest-path";
					}
				}, (i * 40) / this.state.animationSpeed);
			}
		}
	}

	render() {
		return (
			<div>
				<Navbar className="nav">
					<NavDropdown title="algorithms" className="algo-dropdown">
						<NavDropdown.Item onClick={() => this.setState({ currentAlgorithm: "dijkstra" })}>Dijkstra</NavDropdown.Item>
						<NavDropdown.Item onClick={() => this.setState({ currentAlgorithm: "a*" })}>A*</NavDropdown.Item>
						<NavDropdown.Item onClick={() => this.setState({ currentAlgorithm: "bredth first search" })}>
							Bredth First Search
						</NavDropdown.Item>
						<NavDropdown.Item onClick={() => this.setState({ currentAlgorithm: "depth first search" })}>
							Depth First Search
						</NavDropdown.Item>
					</NavDropdown>
					<NavDropdown title="speed" className="speed-dropdown">
						<NavDropdown.Item onClick={() => this.setState({ animationSpeed: 1 })}>x1</NavDropdown.Item>
						<NavDropdown.Item onClick={() => this.setState({ animationSpeed: 1.5 })}>x1.5</NavDropdown.Item>
						<NavDropdown.Item onClick={() => this.setState({ animationSpeed: 2 })}>x2</NavDropdown.Item>
					</NavDropdown>
					<Button onClick={() => this.clearGrid()} className="button">
						Clear the board
					</Button>
					<Button onClick={() => this.clearWalls()} className="button">
						Clear the walls
					</Button>

					<p className="information">current algorithm: {this.state.currentAlgorithm}</p>
					<p className="information">animation speed: x{this.state.animationSpeed}</p>
				</Navbar>
				{/* <Navbar>
					<Button className="place-node-button">
						<div className="start-div"></div> start point
					</Button>
					<Button className="place-node-button">
						<div className="finish-div"></div> finish point
					</Button>
					<Button className="place-node-button">
						<div className="wall-div"></div> wall
					</Button>
				</Navbar> */}
				<Button variant="light" onClick={() => this.visualize(this.state.currentAlgorithm)}>
					Visualize the chosen algorithm
				</Button>
				<div>
					<table className="grid-area">
						<tbody className="grid">
							{this.state.grid.map((row, rowIndex) => {
								return (
									<tr key={rowIndex}>
										{row.map((node, nodeIndex) => {
											const { row, col, isFinish, isStart, isWall } = node;
											return (
												<Node
													key={nodeIndex}
													row={row}
													col={col}
													isFinish={isFinish}
													isStart={isStart}
													isWall={isWall}
													mouseIsPressed={this.state.mouseIsPressed}
													onMouseDown={(row, col) => this.handleMouseDown(row, col)}
													onMouseEnter={(row, col) => this.handleMouseEnter(row, col)}
													onMouseUp={() => this.handleMouseUp(row, col)}
												/>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		);
	}
}

// functions

// place the wall node(if isWall is true) on the grid and return a new grid
const getNewGridWithWallToggled = (grid, row, col) => {
	const newGrid = [...grid];
	const node = newGrid[row][col];
	if (!node.isStart && !node.isFinish && node.isNode) {
		const newNode = {
			...node,
			isWall: !node.isWall,
		};
		newGrid[row][col] = newNode;
	}
	return newGrid;
};

const getNodesInShortestPathOrder = (finishNode) => {
	const nodesInShortestPathOrder = [];
	let currentNode = finishNode;
	while (currentNode !== null) {
		nodesInShortestPathOrder.unshift(currentNode);
		currentNode = currentNode.previousNode;
	}
	return nodesInShortestPathOrder;
};
