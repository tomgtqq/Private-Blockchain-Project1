//jshint esversion: 6
/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');


const TimeoutRequestsWindowTime = 10000000*60*1000; 

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block('Genesis Block');
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            this.height = this.chain.length - 1;
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try{
            let height = await self.getChainHeight();
            block.height = height + 1; 
            let previousBlock = self.getBlockByHeight(height);
            if(previousBlock){
                block.previousBlockHash = previousBlock.hash;    
            }
            block.hash = SHA256(JSON.stringify(block)).toString();
            self.chain.push(block);
            resolve(block);
           }
           catch(err){
            console.error(err);
            reject(err);
          }   
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            const message = `${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`;
            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, body) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let requestTimeStamp =  parseInt(message.split(':')[1]);
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
            let timeElapse = currentTime - requestTimeStamp;
            let timeLeft =(TimeoutRequestsWindowTime/1000) - timeElapse; 
            console.log(`requestTimeStamp: ${requestTimeStamp}, currentTime: ${currentTime},timeElapse: ${timeElapse} ,timeLeft:${timeLeft}`);
            if(timeLeft > 0){
                let isValid = bitcoinMessage.verify(message, address, signature);
                if(isValid){
                    let block = new BlockClass.Block(body);
                    let obj = await self._addBlock(block);
                    resolve(obj);
                }else{
                    reject("The address unauthorized");
                }
            }else{
                reject(`Please submit Star in 5 minutes，Timeout ${parseInt(Math.abs(timeLeft/60))} minutes!`);
             }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.chain.forEach((block)=>{
                if(block.hash === hash){
                    resolve(block);
                }
            });
            reject("Not Found!");
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        return this.chain[height];
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        let promises = [];

        return new Promise((resolve, reject) => {
            self.chain.forEach((block) => {
                promises.push(block.getBData()); 
                });
            Promise.all(promises).then((results) => {
                results.forEach((result) => {
                    let data = JSON.parse(result);
                    if(data.owner === String(address)){
                        data.star.story = hex2ascii(data.star.story);
                        stars.push(data);
                    }
                });
                resolve(stars);
            });
    });
}

    /**
     *  Validate if Block is being tampered by Block Height
     * @param {*} height 
     */
    validateBlock(height) {
        let self = this ;
        return new Promise(function(resolve, reject){
            const block = self.getBlockByHeight(height);  
            resolve(block.validate());
        });
    }
    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self =  this ;
        let errorLog = [] ;
  
        return new Promise(function (resolve , reject) {   
                let promises = [];
          
                self.chain.forEach((block,index,blockchain)=>{
                    promises.push(self.validateBlock(block.height));
                    if(block.height > 0){
                        let previousBlockHash = block.previousBlockHash ;
                        let hash = blockchain[index - 1].hash; // the hash is previous Block.hash
                        if(hash != previousBlockHash){
                            errorLog.push(`Error - Block Height: ${block.height} - Previous Hash don't match.`);
                        }
                    }
                });
                // validate each block in the blockchain @cool run all those promises in parallel
                Promise.all(promises).then((results) => {
                    results.forEach((valid, index) => {
                        if(!valid){
                            errorLog.push(`Error - Block Height: ${self.chain[index].height} - Has been Tampered.`);
                        }
                    });
                    resolve(errorLog);
                });
        });
    }
}

module.exports.Blockchain = Blockchain;   