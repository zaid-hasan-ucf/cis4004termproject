# cis4004termproject

MERN repo setup

Installation

1. From the repo root:

```
npm install
```

2. Install server and client dependencies:

```
cd server
npm install

cd ../client
npm install
```

3. Run

- Start both (from root):

```
npm run dev
```

- Or run separately (Separate terminals, also from root):

```
npm run dev:server
npm run dev:client
```


IMPORTANT!!!!!!!
Ensure you have run the db with mongod --dbpath ./data/db while in the root of the repo
or this WILL fail
