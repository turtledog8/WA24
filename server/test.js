import { assert } from 'chai';
import * as db from "../server/src/data/database.js";
// database.js
const auctions = [];
export { auctions };

describe('Database Tests', function () {
    beforeEach(async function () {
        // Clear the auctions array before each test
        db.auctions.length = 0;
    });

    it('should edit an existing auction', async function () {
        // Create an auction
        const auction1 = {
            item: "Bohumil Kafka ",
            description: "(1878-1942 Czech) Rare Tall Polychrome Carved Statue of Baby Jesus.\n" +
                " This is a magnificent and rare original early 20th Century antique carved wooden polychrome statue depicting St. Anthony of Padua with the infant baby Jesus in his arms.\n" +
                "\n" +
                "The exceptional carving dates from circa 1900-1915 and it measures a very impressive 3.s feet in height.\n" +
                "\n" +
                "Carved by the famous listed Czechoslovakian Sculptor and teacher Bohumil Kafka (1878-1942).\n" +
                "\n" +
                "The intricately carved polychrome painted piece is entirely original throughout, retaining the original pigmentation with a fabulous aged patina.\n" +
                "\n" +
                "It has a carved and gilt-painted signature on the base that reads:-\n" +
                "\n" +
                "A rare piece and a fabulous original example with two carved figures.\n",
            tags: { time: "1900s", type: "Statue", size: "91" },
            images: [
                "http://localhost:3000/img/auctions/jesus/jesus1.jpeg",
                "http://localhost:3000/img/auctions/jesus/jesus2.jpeg",
                "http://localhost:3000/img/auctions/jesus/jesus3.jpeg",
                "http://localhost:3000/img/auctions/jesus/jesus4.jpeg",
            ]
        };
        await db.addAuction(auction1);

        // Modify the auction
        const updatedAuction = {
            item: "Updated Item",
            description: "Updated Description",
            tags: { time: "Updated Time", type: "Updated Type", size: "Updated Size" },
            images: ["Updated Image"],
        };

        // Edit the auction
        const result = await db.editAuction(0, updatedAuction);

        // Check if the edit was successful
        assert.isTrue(result, 'Edit operation should return true');

        // Check if the auction was updated
        const editedAuction = await db.getAuctionById(0);
        assert.deepEqual(editedAuction, {
            id: 0,
            ...auction1, // Original auction properties
            ...updatedAuction, // Updated properties
            tags: { ...auction1.tags, ...updatedAuction.tags } // Merged tags
        }, 'Auction should be updated');
    });

    // Add more tests as needed
});
