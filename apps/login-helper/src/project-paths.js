'use strict';
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const configured=require('../../../config/paths.json');
module.exports={root,...Object.fromEntries(Object.entries(configured).map(([key,value])=>[key,path.resolve(root,value)]))};
