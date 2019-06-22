//jshint esversion: 6
/**
 *          BlockchainController
 *       (Do not change this code)
 * 
 * This class expose the endpoints that the client applications will use to interact with the 
 * Blockchain dataset
 */
const StarDataObjClass = require('./src/StarDataObj.js');

class BlockchainController {

    //The constructor receive the instance of the express.js app and the Blockchain class
    constructor(app, blockchainObj) {
        this.app = app;
        this.blockchain = blockchainObj;
        // All the endpoints methods needs to be called in the constructor to initialize the route.
        this.getBlockByHeight();
        this.requestOwnership();
        this.submitStar();
        this.getBlockByHash();
        this.getStarsByOwner();
        this.validateBlock();
        this.validateBlockchain();
    }

    // Enpoint to Get a Block by Height (GET Endpoint)
    getBlockByHeight() {
        this.app.get("/block/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                let block = await this.blockchain.getBlockByHeight(height);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // Endpoint that allows user to request Ownership of a Wallet address (POST Endpoint)
    requestOwnership() {
        this.app.post("/requestValidation", async (req, res) => {
            if(req.body.address) {
                const address = req.body.address;
                const message = await this.blockchain.requestMessageOwnershipVerification(address);
                if(message){
                    return res.status(200).json(message);
                } else {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // Endpoint that allow Submit a Star, yu need first to `requestOwnership` to have the message (POST endpoint)
    submitStar() {
        this.app.post("/submitstar", async (req, res) => {
            if(req.body.address && req.body.message && req.body.signature && req.body.star) {
                const address = req.body.address;
                const message = req.body.message;
                const signature = req.body.signature;
                const star = req.body.star;
                try {
                    let starDataObj  = new StarDataObjClass.StarDataObj(address, star);
                    if(starDataObj.checkStarDataValidity()){ 
                        let body = starDataObj;
                        let block = await this.blockchain.submitStar(address, message, signature, body);
                        if(block){
                            return res.status(200).json(block);
                        } else {
                            return res.status(500).send("An error happened!");
                        }
                     }else{
                        return res.status(400).send("Please Check RA,DEC data");
                    }
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send("Check the Body Parameter!");
            }
        });
    }

    // This endpoint allows you to retrieve the block by hash (GET endpoint)
    getBlockByHash() {
        this.app.get("/blocks/hash::value", (req, res) => {
            if(req.params.value) {
                const hash = req.params.value;
                this.blockchain.getBlockByHash(hash)
                .then((result) =>{
                    if(result){
                        return res.status(200).json(result);
                    } else {
                        return res.status(404).send("Block Not Found!");
                    }
                })
                .catch((err) => {
                    res.status(404).send(err);
                });
          }
    });
}

    // This endpoint allows you to request the list of Stars registered by an owner
    getStarsByOwner() {
        this.app.get("/blocks/address::value", async (req, res) => {
            console.log(`getStarsByOwner${req.params.value}`);
            if(req.params.value) {
                const address = req.params.value;
                try {
                    let stars = await this.blockchain.getStarsByWalletAddress(address);
                    if(stars){
                        return res.status(200).json(stars);
                    } else {
                        return res.status(404).send("Block Not Found!");
                    }
                } catch (error) {
                    return res.status(500).send("An error happened!");
                }
            } else {
                return res.status(500).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }
/***********************************************
 ***************** Validate Block  *************
 ***********************************************/
validateBlock() {
this.app.get("/validate/height::value", (req, res) => {
        if(req.params.value){
            console.log(`req.params.value:${req.params.value}`);
                this.blockchain.validateBlock(req.params.value)
                .then((result) =>{
                    if(result){
                        return res.status(200).send("Block validated");
                    } else {
                        return res.status(404).send("Block Tampered");
                    }
                })
                .catch((err) => {return res.status(500).send("Not Found!");});
            }else{
                return res.status(404).send("Please check the Parameters! ");
            }
        });
    }
/***********************************************
 ***************** Validate Chain *************
 ***********************************************/
validateBlockchain() {
    this.app.get("/validateblockchain", (req, res) => {
                    
        this.blockchain.validateChain().then((result)=>{
            if(result && result.length){
                return res.status(500).json(result);
            } else {
                return res.status(200).send("Blockchain validated");
            }
        }).catch((err) => {console.log(err);res.status(500).send(err);});
     });
    }
}

module.exports = (app, blockchainObj) => { return new BlockchainController(app, blockchainObj);}