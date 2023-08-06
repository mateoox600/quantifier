# Quantifier

The Quantifier project helps to manage exepenses smartly

### Original By [Twidi](https://github.com/twidi/quantifier)

## Start Instructions

To start the dev environment first run `docker compose up -d` in the root of the project, it will start the neo4j database.

To start the server you first need to create a `.env` in the server folder and populate it, a default is available in `template.env`, it should work out of the box.

Then you can start the server by running `npm start` from the server folder.

For the client you need to cd in it's directory and run `npm run dev`.

The server should be available at `localhost:6666` by default.
And the client at `localhost:5173` by default.