import { expect } from '@esm-bundle/chai'

function sleep(milliseconds: number = 500) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('success')
        }, milliseconds)
    })
}

function a() {
    b()
}

function b() {
    expect(true).to.be.false
    // throw Error("damn!")
}

describe("java or mocha", function() {
    it("don't be chai", function() {
        // expect(true).to.be.true
    })
    it("javascript is not java", function() {
        // expect(true).to.be.false
        a()
    })
    it("tape is slow", async function() {
        await sleep(40)
    })
    it("punchcards are slower", async function() {
        await sleep(80)
    })
    xit("cobol is like java", function() {
    })
})