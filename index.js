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
// import
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

const jwt = require('jsonwebtoken');
const { v1: uuidv4 } = require('uuid');
const { tr, no, ca, id } = require("zod/v4/locales");
const { promise } = require("zod/v4");

// recording (like constant)
let lastResetAt = "0000-00-00T00:00:00.000Z";
let lastResetIP = "";

// function
function isValidBirthday(dateString) {
  // check YYYY-MM-DD
  let regex = /^(19[0-9]{2}|20[0-1][0-9]|202[0-5])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // analyse data
  let parts = dateString.split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let day = parseInt(parts[2], 10);

  // check data valid
  let date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }

  // check range 1900-01-01 to 2025-12-31
  let start = new Date(1900, 0, 1);
  let end = new Date(2025, 11, 31);
  return date >= start && date <= end;
}

// Middleware
// check input json
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ "message": 'Invalid JSON input' });
  }
  next();
});

// handle JWT Bearer
const bearerToken = (req, res, next) => {
    const jwtHeader = req.headers['authorization']; 
    // error handle - no auth
    if (!jwtHeader) { 
        req.role = null;
        return next();
    }
    let encoding = jwtHeader.split(" ")[1];
    let user;
    try {
        user = jwt.verify(encoding, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ "Unauthorized": "Invalid token" });
    }
    if (!user.role) { 
        req.role = null;
        return next();
    }
    req.user = user;
    req.role = user.role;
    next();
};

// end points
app.route("/users")
    .post(bearerToken, async(req,res) => {
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
            return res.status(499).json({message: "Failed to find user"});
        }
        if (checjExists.length !== 0) {
            return res.status(409).json({ "Conflict":"user with that utorid already exists" });
        }
        let newUser;
        // create resetToken & expiresAt
        const resetToken = uuidv4();
        let createdAt = new Date();
        const expiresAt = (new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))).toISOString();
        try {
            // create user
            newUser = await prisma.user.create({
                data: {
                    utorid,
                    name,
                    email,
                    createdAt: createdAt.toISOString(),
                    resetToken,
                    expiresAt,
                }
            });
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to create new user"});
        }
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
    .get(bearerToken, async(req,res) => {
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
        if (name !== undefined) {
            where.name = name;
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
        // if no input page or limit, set them to default value
        if (page !== undefined) {
            page = parseInt(page);
            if (Number.isNaN(page) || page <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else { // no input page
            page = 1;
        }
        if (limit !== undefined) {
            limit = parseInt(limit);
            if (Number.isNaN(limit) || limit <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else { // no input limit
            limit = 10;
        }
        // apply all filters
        let results;
        try {
            results = await prisma.user.findMany({
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
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to find user"});
        }
        return res.status(200).json({
            count: results.length,
            results: results.slice((page-1)*limit, ((page-1)*limit)+limit)
        });
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Post"});
    });

app.route("/users/me")
    .patch(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher"});
        }
        // error handling - 400 Bad Request.
        let {name, email, birthday, avatar} = req.body;
        // no fields
        if (!name && !email && !birthday && !avatar) {
            return res.status(400).json({ "Bad Request":"No update field provied" })
        }
        // extra field
        const allowedFields = ["name", "email", "birthday", "avatar"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // find user by id
        // req.user.id
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });
        // error handle - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found":"User not found" });
        }
        // set data meanwhile
        let data ={};
        // not satisfy description
        if (name !== undefined && name !== null) {
            if (typeof(name) !== "string" || !/^.{1,50}$/.test(name)) {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            data.name = name;
        }
        if (email !== undefined && email !== null) {
            if (typeof(email) !== "string" || !/^[^@]+@mail.utoronto.ca$/.test(email)) {
                return res.status(400).json({ "Bad Request": "Invalid email" });
            }
            data.email = email;
        }
        if (birthday !== undefined && birthday !== null) {
            if (typeof(birthday) !== "string" || !isValidBirthday(birthday)) {
                return res.status(400).json({ "Bad Request": "Invalid birthday" });
            }
            data.birthday = birthday;
        }
        if (avatar !== undefined && avatar !== null) {
            if (typeof(avatar) !== "string" || !/\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(avatar)) {
                return res.status(400).json({ "Bad Request": "Invalid avatar" });
            }
            data.avatar = avatar;
        }
        // update
        let result = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: data,
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
                avatarUrl: true
            }
        });
        res.status(200).json(result);
    })
    .get(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher"});
        }
        // find user by id
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
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
                lastLogin: true,
                verified: true,
                avatarUrl: true,
                promotions: true
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        res.status(200).json(user);
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Patch"});
    });

app.route("/users/me/password")
    .patch(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher"});
        }
        // error handling - 400 Bad Request.
        const {old, new: newPassword} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!old || !newPassword ||
            typeof(old) !== "string" || typeof(newPassword) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["old", "new"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // check old password
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        if (user.password !== old) {
            return res.status(403).json({ "Unauthorized": "Incorrect old password" });
        }
        // not satisfy description
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(newPassword)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // update
        await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                password: newPassword
            }
        });
        res.status(200).json();
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Post"});
    });

app.route("/users/:userId")
    .get(bearerToken, async(req,res) => {
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
        try {
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
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to find user"});
        }
        // error handling - 404 Not Found
        if (result === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        res.status(200).json(result);
    })
    .patch(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Manager or higher"
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or highe"});
        }
        // error handling - 400 Bad Request.
        let {email, verified, suspicious, role} = req.body;
        // no fields
        if (!email && (verified === undefined || verified === null) && (suspicious === undefined || suspicious === null) && !role) {
            return res.status(400).json({ "Bad Request": "No update fields provided" })
        }
        // extra field
        const allowedFields = ["email", "verified", "suspicious", "role"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
                return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // error handling - 404 Not Found
        let user;
        try {
            user = await prisma.user.findMany({
                where: {
                    id: userId
                }
            })
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to find user"});
        }
        if (user.length === 0) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handling - 400 Bad Request
        // set data meanwhile
        let data = {};
        let select = {
            id: true,
            utorid: true,
            name: true
        };
        // not satisfy description
        if (email !== undefined && email !== null) {
            if (typeof(email) !== "string" || !/^[^@]+@mail.utoronto.ca$/.test(email)) {
                return res.status(400).json({ "Bad Request": "Invalid email" });
            }
            data.email = email;
            select.email = true;
        }
        if (verified !== undefined && verified !== null) {
            if (typeof(verified) !== "boolean" || verified !== true) {
                return res.status(400).json({ "Bad Request":"Invalid verified" });
            }
            data.verified = verified;
            select.verified = true;
        }
        if (suspicious !== undefined && suspicious !== null) {
            if (typeof(suspicious) !== "boolean") {
                return res.status(400).json({ "Bad Request":"Invalid suspicious" });
            }
            data.suspicious = suspicious;
            select.suspicious = true;
        }
        if (role !== undefined && role !== null) {
            if (typeof(role) !== "string" || (role !== "cashier" && role !== "regular" && role !== "manager" && role !== "superuser")) {
                return res.status(400).json({ "Bad Request":"Invalid role" });
            }
            if (req.role === "manager" && (role === "manager" || role === "superuser")) {
                return res.status(403).json({ "Bad Request":"Unauthorized role change" });
            }
            if (user[0].role === "regular" && role === "cashier" && user[0].suspicious === true) {
                return res.status(400).json({ "Bad Request":"Invalid role (suspicious)" })
            }
            data.role = role;
            select.role = true;
        }
        // update
        let result;
        try {
            result = await prisma.user.update({
                where: {
                    id: userId
                },
                data: data,
                select: select
            });
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to update user"});
        }
        res.status(200).json(result);
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Patch"});
    });

app.route("/auth/tokens")
    .post(async(req,res) => {
        // error handling - 400 Bad Request.
        const {utorid, password} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || !password || typeof(utorid) !== "string" || typeof(password) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "password"];
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
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(password)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // find user by utorid
        let user;
        user = await prisma.user.findUnique({
            where: {
                utorid: utorid
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({message: "No user with given utorid"});
        }
        if (user.password === null || user.password !== password) {
            return res.status(401).json({message: "Incorrect password"});
        }
        let tokenPayload = {
            id: user.id,
            utorid: user.utorid,
            role: user.role
        };
        await prisma.user.update({
            where: {
                utorid: utorid
            },
            data: {
                lastLogin: (new Date()).toISOString()
            }
        });
        const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));
        return res.status(200).json({
            "token": jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" }),
            "expiresAt": expiresAt.toISOString()
        })
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Post"});
    });

app.route("/auth/resets")
    .post(async(req,res) => {
        // error handling - 400 Bad Request.
        const {utorid} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || typeof(utorid) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid"];
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
        // error handle - 429 Too Many Requests
        let now = new Date();
        if (now - lastResetAt < 60000 && req.ip === lastResetIP) {
            return res.status(429).json({message: "Too Many Requests"});
        }
        // find user by utorid
        let user;
        try {
            user = await prisma.user.findUnique({
                where: {
                    utorid: utorid
                }
            })
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to find user"});
        }
        // erroe handle - 404 Not Found
        if (user === null) {
            return res.status(404).json({message: "No user with given utorid"});
        }
        // update
        const resetToken = uuidv4();
        lastResetIP = req.ip;
        lastResetAt = new Date();
        const expiresAt = new Date(lastResetAt + (7 * 24 * 60 * 60 * 1000)).toISOString();
        let updateUser;
        try {
            updateUser = await prisma.user.update({
                where: {
                    utorid
                },
                data: {
                    resetToken,
                    expiresAt,
                }
            })
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to update user"});
        }
        return res.status(202).json({
            "resetToken": updateUser.resetToken,
            "expiresAt": updateUser.expiresAt
        });
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Post"});
    });

app.route("/auth/resets/:resetToken")
    .post(async(req,res) => {
        const token = req.params.resetToken;
        // error handling - 400 Bad Request.
        const { utorid, password} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || !password || typeof(utorid) !== "string" || typeof(password) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "password"];
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
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(password)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // find user
        let user;
        user = await prisma.user.findMany({
            where: {
                resetToken: token
            }
        });
        // error handle - 404 Not Found
        if (user.length === 0) {
            return res.status(404).json({ "Not Found": "Token not found" });
        }
        user = user[0];
        // error handle - 401 Unauthorized
        if (user.utorid !== utorid) {
            return res.status(401).json({ "Unauthorized": "Token does not match user" });
        }
        // error handle - 410 Gone
        if (user.expiresAt === "gone") {
            return res.status(410).json({ "Gone": "Token expired" });
        }
        // reset password
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: password
            }
        });
        res.status(200).json();
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Post"});
    });

app.route("/events")
    .post(bearerToken, async(req,res) => {
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
        const {name, description, location, startTime, endTime, capacity, points} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!name || !description || !location || !startTime || !endTime || points === undefined ||
            typeof(name) !== "string" || typeof(description) !== "string" || 
            typeof(location) !== "string" || typeof(startTime) !== "string" || 
            typeof(endTime) !== "string" || typeof(points) !== "number") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["name", "description", "location", "startTime", "endTime", "capacity", "points"];
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
        let data = {};
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(startTime) || (new Date(startTime)).toISOString() <= (new Date()).toISOString()) {
            return res.status(400).json({ "Bad Request": "Invalid startTime" });
        }
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
            return res.status(400).json({ "Bad Request": "Invalid endTime" });
        }
        if (!Number.isInteger(points) || points <= 0) {
            return res.status(400).json({ "Bad Request": "Invalid points" });
        }
        if (typeof(capacity) === "number") {
            if (capacity <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            data.capacity = parseInt(capacity);
        }
        // init data
        data.name = name;
        data.description = description;
        data.location = location;
        data.startTime = startTime.split('.')[0] + 'Z';
        data.endTime = endTime.split('.')[0] + 'Z';
        data.pointsRemain = points;
        // create event
        let result = await prisma.event.create({
            data: data,
            select: {
                id: true,
                name: true,
                description: true,
                location: true,
                startTime: true,
                endTime: true,
                capacity: true,
                pointsRemain: true,
                pointsAwarded: true,
                published: true,
                organizers: true,
                guests: true
            }
        });
        res.status(201).json(result);
    })
    .get(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher"});
        }
        // error handling - 400 Bad Request.
        let {name, location, started, ended, showFull, page, limit, published} = req.query;
        // extra field
        const allowedFields = ["name", "location", "started", "ended", "showFull", "page", "limit", "published"];
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
        if (name !== undefined && name !== null) {
            where.name = name;
        } 
        if (location !== undefined && location !== null) {
            where.location = location;
        } 
        if (started !== undefined && started !== null) {
            if (!(started === "true" || started === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid started" });
            }
            if (started === "true") {
                where.startTime = { lt: (new Date()).toISOString() };
            } else {
                where.startTime = { gte: (new Date()).toISOString() };
            }
        }
        if (ended !== undefined && ended !== null) {
            if (!(ended === "true" || ended === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid started" });
            }
            if (started !== undefined && started !== null) {
                return res.status(400).json({ "Bad Request":"Not permitted to use both started and ended" });
            }
            if (ended === "true") {
                where.endTime = { lt: (new Date()).toISOString() };
            } else {
                where.endTime = { gte: (new Date()).toISOString() };
            }
        }
        if (showFull !== undefined && showFull !== null) {
            if (!(showFull === "true" || showFull === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid showFull" });
            }
            if (showFull === "true") {
                // no filter
            } else {
                where.OR = [
                    { capacity: null },
                    { numGuests: { lt: prisma.event.fields.capacity } }
                ];
            }
        } else {
            // default no show full events
            where.OR = [
                { capacity: null },
                { numGuests: { lt: prisma.event.fields.capacity } }
            ];
        }
        // if no input page or limit, set them to default value
        if (page !== undefined) {
            page = parseInt(page);
            if (Number.isNaN(page) || page <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else { // no input page
            page = 1;
        }
        if (limit !== undefined) {
            limit = parseInt(limit);
            if (Number.isNaN(limit) || limit <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else { // no input limit
            limit = 10;
        }
        //published filter
        if (published !== undefined && published !== null) {
            if (!(published === "true" || published === "false")) {
                return res.status(400).json({ "Bad Request":"Invalid published" });
            }
            if (req.role === "regular" || req.role === "cashier") {
                return res.status(403).json({ "Forbidden":"Not permit to use published filter" });
            }
            where.published = published === "true";
        } else {
            if (req.role === "regular" || req.role === "cashier") {
                where.published = true;
            }
        }
        // set select
        let select = {
            id: true,
            name: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            numGuests: true,
        }
        if (req.role !== "regular" && req.role !== "cashier") {
            select.pointsRemain = true;
            select.pointsAwarded = true;
            select.published = true;
        }
        // apply all filters
        let results;
        try {
            results = await prisma.event.findMany({
                where: where,
                select: select
            });
        } catch(error) {
            console.log(error);
            return res.status(499).json({message: "Failed to find user"});
        }
        return res.status(200).json({
            count: results.length,
            results: results.slice((page-1)*limit, ((page-1)*limit)+limit)
        });
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get & Post"});
    });

app.route("/events/:eventId")
    .get(bearerToken, async(req,res) => {
        res.status(405).json();
    })
    .patch(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // get organizers of the event
        const eventId = parseInt(req.params.eventId)
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        // if not organizer && not "Manager or higher"
        if (!organizerIds.includes(req.user.id) && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher or organizer"});
        }
        // error handling - 400 Bad Request.
        let {name, description, location, startTime, endTime, capacity, points, published} = req.body;
        // extra field
        const allowedFields = ["name", "description", "location", "startTime", "endTime", "capacity", "points", "published"];
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
        let data = {};
        let select = {
            id: true,
            name: true,
            location: true
        };
        if (name !== undefined && name !== null) {
            if (typeof(name) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update name of started event" });
            }
            data.name = name;
            select.name = true;
        }
        if (description !== undefined && description !== null) {
            if (typeof(description) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid description" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update description of started event" });
            }
            data.description = description;
            select.description = true;
        }
        if (location !== undefined && location !== null) {
            if (typeof(location) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid location" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update location of started event" });
            }
            data.location = location;
            // location is always selected
        }
        if (startTime !== undefined && startTime !== null) {
            if (typeof(startTime) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid startTime" });
            }
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(startTime) || (new Date(startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Invalid startTime" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update startTime of started event" });
            }
            if (endTime === undefined && endTime === null) { // 10
                // check id startTime < existing endTime
                if (startTime >= event.endTime) {
                    return res.status(400).json({ "Bad Request": "Invalid startTime" });
                }
            }
            data.startTime = startTime.split('.')[0] + 'Z';
            select.startTime = true;
        }
        if (endTime !== undefined && endTime !== null) {
            if (typeof(endTime) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid endTime" });
            }
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(endTime) || (new Date(endTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Invalid endTime" });
            }
            if ((new Date(event.endTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update endTime of ended event" });
            }
            if (startTime === undefined && startTime === null) { // 01
                // check endTime > existing startTime
                if (endTime <= event.startTime) {
                    return res.status(400).json({ "Bad Request": "Invalid endTime" });
                }
            } else { // 11
                // startTime is also provided
                // check endTime > startTime
                if (startTime >= endTime) {
                    return res.status(400).json({ "Bad Request": "Invalid startTime and endTime" });
                }
            }
            data.endTime = endTime.split('.')[0] + 'Z';
            select.endTime = true;
        }
        if (capacity !== undefined) {
            if (typeof(capacity) !== "number" && capacity !== null) {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            if (typeof(capacity) === "number" && capacity <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            // special checks
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update capacity of started event" });
            }
            if (capacity !== null) {
                if (event.capacity === null || capacity < event.capacity ) {
                    if (capacity < event.numGuests) {
                        return res.status(400).json({ "Bad Request": "Invalid capacity" });
                    }
                }
            }
            data.capacity = capacity === null ? null : parseInt(capacity);
            select.capacity = true;
        }
        if (points !== undefined && points !== null) {
            if (req.role !== "manager" && req.role !== "superuser") {
                return res.status(403).json({ "Forbidden": "Manager or higher"});
            }
            if (typeof(points) !== "number") {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            if (points <= 0 || !Number.isInteger(points)) {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            if (points < (event.pointsAwarded + event.pointsRemain)) {
                if (points < event.pointsAwarded) {
                    return res.status(400).json({ "Bad Request": "Invalid points" });
                }
            }
            data.pointsRemain = points - event.pointsAwarded;
            select.pointsRemain = true;
        }
        if (published !== undefined && published !== null) {
            if (req.role !== "manager" && req.role !== "superuser") {
                return res.status(403).json({ "Forbidden": "Manager or higher"});
            }
            if (typeof(published) !== "boolean" || published !== true) {
                return res.status(400).json({ "Bad Request": "Invalid published" });
            }
            data.published = published;
            select.published = true;
        }
        // update
        let result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: data,
            select: select
        });
        res.status(200).json(result);
    })
    .delete(bearerToken, async(req,res) => {
        res.status(405).json();
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Get, Patch & Delete"});
    });

app.route("/events/:eventId/organizers")
    .post(bearerToken, async(req,res) => {
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
        const {utorid} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || typeof(utorid) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        // find user by utorid
        let user = await prisma.user.findUnique({
            where: {
                utorid
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // error handle - 410 Gone
        if (event.endTime < (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        // error handle - 400 Bad Request
        // check if user is already an guest
        let guests = await prisma.event.findMany({
            where: {
                id: eventId,
                guests: {
                    some: {
                        id: user.id
                    }
                }
            }
        });
        if (guests.length > 0) {
            return res.status(400).json({ "Bad Request": "User is already an guests" });
        }
        // add organizer
        let result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                organizers: {
                    connect: { id: user.id }
                }
            },
            select: {
                id: true,
                name: true,
                location: true,
                organizers: true
            }
        });
        res.status(201).json(result);
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Post"});
    });

app.route("/events/:eventId/organizers/:userId")
    .delete(bearerToken, async(req,res) => {
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
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // find user by userId
        let user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 400 Bad Request
        // check if user is an organizer
        let guests = await prisma.event.findMany({
            where: {
                id: eventId,
                organizers: {
                    some: {
                        id: userId
                    }
                }
            }
        });
        if (guests.length === 0) {
            return res.status(400).json({ "Bad Request": "User is not an organizer" });
        }
        // remove organizer
        await prisma.event.update({
            where: {
                id: eventId
            },
            data:{
                organizers: {
                    disconnect: { id: userId }
                }
            }
        });
        res.status(204).json();
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Delete"});
    });

app.route("/events/:eventId/guests")
    .post(bearerToken, async(req,res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // get organizers of the event
        // process eventId
        const eventId = parseInt(req.params.eventId)
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        // if not organizer && not "Manager or higher"
        if (!organizerIds.includes(req.user.id) && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher or organizer"});
        }
        // error handle - 404 Not Found
        if (event.published === false) {
            return res.status(404).json({ "Not Found":"Not visible yet" });
        }
        // error handle - 400 Bad Request.
        const {utorid} = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if(!utorid || typeof(utorid) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        // find user by utorid
        let user = await prisma.user.findUnique({
            where: {
                utorid
            },
            select: {
                id: true,
                utorid: true,
                name: true
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 410 Gone
        if (event.endTime < (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        if (event.capacity !== null) {
            if (event.numGuests >= event.capacity) {
                return res.status(410).json({ "Gone": "Event is full" });
            }
        }
        // error handle - 400 Bad Request
        // check if user is already an organizer
        let organizers = await prisma.event.findMany({
            where: {
                id: eventId,
                organizers: {
                    some: {
                        id: user.id
                    }
                }
            }
        });
        if (organizers.length > 0) {
            return res.status(400).json({ "Bad Request": "User is already an organizer" });
        }
        // add guest
        let newEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                guests: {
                    connect: { id: user.id }
                },
                numGuests: { increment: 1 }
            },
            select: {
                id: true,
                name: true,
                location: true,
                numGuests: true
            }
        });
        let result = {
            id: newEvent.id,
            name: newEvent.name,
            location: newEvent.location,
            guestAdded: user,
            numGuests: newEvent.numGuests
        };
        res.status(201).json(result);
    })
    .all((req,res) => {
        res.status(405).json({"Method Not Allowed": "Try Post"});
    });

app.route("/events/:eventId/guests/:userId")
    .delete(bearerToken, async(req,res) => {
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
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        const organizerIds = event.organizers.map((org) => org.id);
        // not organizer self-remove
        if (organizerIds.includes(req.user.id)) {
            return res.status(403).json({ "Forbidden": "self-remove is not allowed"});
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // find user by userId
        let user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 400 Bad Request
        // check if user is an guest
        const guestsIds = event.guests.map((org) => org.id);
        if (!guestsIds.includes(userId)) {
            return res.status(400).json({ "Bad Request": "User is not an guest" });
        }
        // remove organizer
        await prisma.event.update({
            where: {
                id: eventId
            },
            data:{
                guests: {
                    disconnect: { id: userId }
                },
                numGuests: { decrement: 1 }
            }
        });
        res.status(204).json();
    })
    .all((req,res) => {
        res.status(405).json({ "Method Not Found": "Try Delete" });
    });

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});