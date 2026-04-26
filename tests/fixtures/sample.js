import express from 'express';

const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const redisUrl = process.env.REDIS_URL;
const nodeEnv = process.env.NODE_ENV;
const apiUrl = process.env.API_BASE_URL;
const missingVar = process.env.STRIPE_API_KEY;
const missingVar2 = process.env.NEW_FEATURE_FLAG;

// Dynamic access
const dynamicKey = 'SOME_KEY';
const dynValue = process.env[dynamicKey];

// Bracket access with string literal
const bracketVar = process.env['BRACKET_VAR'];

console.log(port, dbUrl, jwtSecret, redisUrl, nodeEnv, apiUrl, missingVar, missingVar2, dynValue, bracketVar);
