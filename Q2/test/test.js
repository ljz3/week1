const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

describe("HelloWorld", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () {
        const circuit = await wasm_tester(
            "contracts/circuits/HelloWorld.circom"
        );

        const INPUT = {
            a: 2,
            b: 3,
        };

        const witness = await circuit.calculateWitness(INPUT, true);

        console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(6)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        // Generate proof and the circuit output using groth16
        const { proof, publicSignals } = await groth16.fullProve(
            { a: "2", b: "3" },
            "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm",
            "contracts/circuits/HelloWorld/circuit_final.zkey"
        );

        console.log("2x3 =", publicSignals[0]);

        // Generate solidity calldata using the proof and circuit output
        const calldata = await groth16.exportSolidityCallData(
            proof,
            publicSignals
        );

        // Convert the solidity calldata to an arguments string array
        const argv = calldata
            .replace(/["[\]\s]/g, "")
            .split(",")
            .map((x) => BigInt(x).toString());

        // Separate the arguments into correctly sized arrays to be used in verifier contract
        const a = [argv[0], argv[1]];
        const b = [
            [argv[2], argv[3]],
            [argv[4], argv[5]],
        ];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        // Use the verifier contract to verify the proof
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        // Use dummy arguments for proof verification
        let a = [0, 0];
        let b = [
            [0, 0],
            [0, 0],
        ];
        let c = [0, 0];
        let d = [0];
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});

describe("Multiplier3 with Groth16", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        const circuit = await wasm_tester(
            "contracts/circuits/Multiplier3.circom"
        );

        const INPUT = {
            a: 2,
            b: 3,
            c: 5,
        };

        const witness = await circuit.calculateWitness(INPUT, true);

        assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]), Fr.e(30)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        // Generate proof and the circuit output using groth16
        const { proof, publicSignals } = await groth16.fullProve(
            { a: "2", b: "3", c: "5" },
            "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm",
            "contracts/circuits/Multiplier3/circuit_final.zkey"
        );

        // Generate solidity calldata using the proof and circuit output
        const calldata = await groth16.exportSolidityCallData(
            proof,
            publicSignals
        );

        // Convert the solidity calldata to an arguments string array
        const argv = calldata
            .replace(/["[\]\s]/g, "")
            .split(",")
            .map((x) => BigInt(x).toString());

        // Separate the arguments into correctly sized arrays to be used in verifier contract
        const a = [argv[0], argv[1]];
        const b = [
            [argv[2], argv[3]],
            [argv[4], argv[5]],
        ];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);

        // Use the verifier contract to verify the proof
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        // Use dummy arguments for proof verification
        let a = [0, 0];
        let b = [
            [0, 0],
            [0, 0],
        ];
        let c = [0, 0];
        let d = [0];
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});

describe("Multiplier3 with PLONK", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        // Generate proof and the circuit output using PLONK
        const { proof, publicSignals } = await plonk.fullProve(
            { a: "2", b: "3", c: "5" },
            "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm",
            "contracts/circuits/Multiplier3_plonk/circuit_final.zkey"
        );

        // Generate solidity calldata using the proof and circuit output
        const calldata = await plonk.exportSolidityCallData(
            proof,
            publicSignals
        );

        // Get the proof from the calldata
        const proofCalldata = calldata.split(",")[0];

        // Use the verifier contract to verify the proof
        expect(await verifier.verifyProof(proofCalldata, publicSignals)).to.be
            .true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        const proofCalldata =
            "0x2f8a36ec044ac2f6e0df858aa96855070ee81f7bfa0ce61cce082a0d3e09548224cd787dab59d6c4bee2fd5121eff8f9b6dd752eb30cb07f3bf7a3ffc6a42202103f1c9af02f8aec1110edcf7ca8f80edee8d1948b69e9e9b73ea6a0bea0355f16efc96d3e75e1e9f13878e308b6ea545319703b37b88ddd9c8826c7bcd645e42d36dffa24b3d61841d139169ca38814d89d5495540df4b3b764e57060178be81834907a6728af64b2dfc8af03cf11c2d2ed7010c32acdaa6ac02a6e4f02a8e916fb2298dddf8bd9c27e0dbb62effe84dd61e6101e7731573830b87e36baaa14240ef64a04eaa331ae33fb01c5af0edb53decc0e9cb01a7d4ba750d01cb71daa242fca3c59f4eeeb5eff7fb32597764374862abcbfc5c24644f72b3065eeb28a0c7c62866c6754ba703d3bdffddc4fa5e3cc15a8e9395d6174fd99d18c6f19381cb161e6ea096a8cd795a0066479ed1d626f7a696f42ce288c102c3c3d3dfe23265d53e61486a6895301cdaa7c14fc45505eb716ee4342918b1e6f0beed44d721acd077bd645ffdb940a9f9ff74edbd03c77d3894a6d4d73b10edf01e84903de0bdf8f4fec72c836a3d5e6a0c6d4f9b5c682bc8f670ad5df99852b35c95b9c8f2c78365aafb51b045d46653d2b13eee564acdfe52561e39f1d22c7d4c600f77d2b6c15c04a2dc92a281f0713f526122dba6f148c94b732276bc28a5f774b1eaf1e9f13aa1c01619abf9b020b9c022cedcf6dfb6fb1db5e530e1b8c48fd46981501aa3261f76dd0d2a3c4b54c6d451edf1cc3571138d95aaf26a828c400c6dd6f29438ae480847aeaf4602faf2268c681467aa03a11c3b8a0ed917280be2c3257225ddc9dfe586f3f6a0e42fc5a624e0b11f32eef5b072ed53dfafaf976f19f30267048e900102d775895a5c6f5aa9124222968c44a4383c010e47cff22dd5a211a8f033c40bfa120129650f6318c2164a93e1e2b18fd0763682f07aec21144c10dbbb87d5fc5cbe86308d91d42d61c8b76915be83b513d14434d8fb9f71a3e67152f17bf61bf55927799db513e3eba58e8120a9d56288c749635f20b56052d23062941baed00d8168c7293f58ecfd73bd015aaafdd9eccbd2ac0832e9255a196";
        const publicSignals = [0];
        expect(await verifier.verifyProof(proofCalldata, publicSignals)).to.be
            .false;
    });
});
