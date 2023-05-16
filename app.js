const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require("cors");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(cors());
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => console.log("Server running at localhost 3000"));
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const haspPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const haspPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//1
app.get("/todos/", async (request, response) => {
  try {
    let data = "";
    let getTodoQuery = "";
    let { search_q = "", priority, status } = request.query;

    switch (true) {
      case haspPriorityAndStatusProperties(request.query):
        getTodoQuery = `
            select * from todo where todo like '%${search_q}%'
            and status = '${status}' and priority = '${priority}';`;
        break;
      case haspPriorityProperty(request.query):
        getTodoQuery = `
            select * from todo where todo like '%${search_q}%'
            and priority = '${priority}'`;
        break;
      case hasStatusProperty(request.query):
        getTodoQuery = `
            select * from todo where todo like '%${search_q}%'
            and status = '${status}'`;
        break;
      default:
        getTodoQuery = `
            select * from todo where todo like '%${search_q}%'`;
        break;
    }

    data = await database.all(getTodoQuery);
    response.send(data);
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
});

//2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = '${todoId}';`;
  const data = await database.get(getTodoQuery);
  response.send(data);
});

//3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `insert into todo(id, todo, priority, status) 
    values (${id}, '${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
