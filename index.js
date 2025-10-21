#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const { Prisma } = require("@prisma/client");
const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

const jwt = require('jsonwebtoken');
const { v1: uuidv4 } = require('uuid');
const { tr } = require("zod/v4/locales");

// Middleware
// check input json
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ "Bad Request": 'Invalid JSON input' });
  }
  next();
});

// handle JWT Bearer
const JWTBearer = (req, res, next) => {
    const JWTBearer = req.headers['authorization']; 
    // error handle - no auth || not JWT Bearer auth
    if (!JWTBearer || !JWTBearer.startsWith("Bearer ")) { 
        req.role = null;
        return next();
    }
    let encoding = JWTBearer.split(" ")[1];
    let role = jwt.verify(encoding, process.env.JWT_SECRET);
    req.role = role.role;
    next();
};

// end points
app.route("/users")
    .post(JWTBearer, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Cashier or higher"
        if (req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Cashier or higher"});
        }
        // error handling - 400 Bad Request.
        const {utorid, name, email} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || !name || !email || 
            typeof(utorid) !== "string" || typeof(name) !== "string" || typeof(email) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "name", "email"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        if (!/^.{1,50}$/.test(name)) {
            return res.status(400).json({ "Bad Request": "Invalid name" });
        }
        if (!/^[^@]+@mail.utoronto.ca$/.test(email)) {
            return res.status(400).json({ "Bad Request": "Invalid email" });
        }
        // error handle - 409 Confilict
        let checjExists;
        try {
            checjExists = await prisma.user.findMany({
                where:{
                    utorid
                }
            });
        } catch(error) {
            console.log(error);
            return res.status(400).json({message: "Failed to find user"});
        }
        if (checjExists.length !== 0) {
            return res.status(409).json({ "Conflict":"user with that utorid already exists" });
        }
        // create user
        let createdAt = new Date()
        let newUser;
        try {
            newUser = await prisma.user.create({
                data: {
                    utorid,
                    name,
                    email,
                    createdAt: createdAt.toISOString()
                }
            });
        } catch(error) {
            console.log(error);
            return res.status(400).json({message: "Failed to create new user"});
        }
        // create resetToken & expiresAt
        const resetToken = uuidv4();
        const expiresAt = (new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))).toISOString();
        return res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: expiresAt,
            resetToken: resetToken
        });
    })
    .get(JWTBearer, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Manager or higher"
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher"});
        }
        // error handling - 400 Bad Request.
        let {name, role, verified, activated, page, limit} = req.query;
        // extra field
        const allowedFields = ["name", "role", "verified", "activated", "page", "limit"];
        const extraFields = Object.keys(req.query).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // set filter(where) meanwhile
        let where ={};
        // not satisfy description
        // if (name !== undefined && !/^.{1,50}$/.test(name)) {
        //     return res.status(400).json({ "Bad Request": "Invalid name" });
        // }
        if (name !== undefined) {
            where.name = name;
        } 
        if (role !== undefined && (role !== "regular" && role !== "cashier" && role !== "manager" && role !== "superuser")) {
            return res.status(400).json({ "Bad Request": "Invalid role" });
        }
        if (role !== undefined) {
            if (role !== "regular" && role !== "cashier" && role !== "manager" && role !== "superuser") {
                return res.status(400).json({ "Bad Request": "Invalid role" });
            }
            where.role = role;
        }
        if (verified !== undefined) {
            if (!(verified === "true" || verified === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid verified" });
            }
            where.verified = verified === "true";
        }
        if (activated !== undefined) {
            if (!(activated === "true" || activated === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid activated" });
            }
            where.lastLogin = activated === "true"? { not: null } : null;
        }
        // if no inout page or limit, set them to default value
        if (page !== undefined) {
            page = parseInt(page);
            if (Number.isNaN(page)) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else { // no input page
            page = 1;
        }
        if (limit !== undefined) {
            limit = parseInt(limit);
            if (Number.isNaN(limit)) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else { // no input limit
            limit = 10;
        }
        // apply all filters
        let results = await prisma.user.findMany({
            where: where,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            }
        });
        return res.status(200).json({
            count: results.length,
            results: results.slice((page-1)*limit, ((page-1)*limit)+limit)
        });
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Post"});
    });

app.route("/users/:userId")
    .get(JWTBearer, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Cashier or higher"
        if (req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Cashier or higher"});
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
                return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // get user's information by userId
        // 2 cases: cashier && manager or higher
        let result;
        if (req.role == "cashier") {
            result = await prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    points: true,
                    verified: true,
                    promotions: true
                }
            })
        } else {
            result = await prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    verified: true,
                    avatarUrl: true,
                    promotions: true
                }
            })
        }
        // error handling - 404 Not Found
        if (result === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        res.status(200).json(result);
    })
    .patch(JWTBearer, async(req,res) => {
        res.status(200).json();
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Post"});
    });
    
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});