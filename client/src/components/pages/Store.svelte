<script>
    import { onMount } from "svelte";
    import SmallAuction from "../auctions/SmallAuction.svelte";
    import SearchBar from "../SearchBar.svelte";
    import Filter from "../Filter.svelte";
    import { navigate } from "svelte-routing";

    export let auctions = [];
    export let searchFilteredAuctions = [];
    export let tagFilteredAuctions = [];
    let isAdmin = false;

    // Use onMount to fetch data when the component is mounted
    onMount(async () => {
        try {
            const response = await fetch("http://localhost:3000/auctions", {
                method: "GET"
            });
            if (response.ok) {
                auctions = await response.json(); // Parse the response JSON
                tagFilteredAuctions = auctions;
                searchFilteredAuctions = auctions;
            } else {
                console.error("Failed to fetch data");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        // Check if the user is an admin
        const token = localStorage.getItem('token');
        if (token !== null) {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            isAdmin = decodedToken.isAdmin || false;
        }
    });

    export const updateSearchAuctions = (newAuctions) => {
        searchFilteredAuctions = newAuctions;
    }

    export const updateTagAuctions = (newAuctions) => {
        tagFilteredAuctions = newAuctions
    }

    const extractUniqueTags = (auctions) => {
        const tagData = {};
        auctions.forEach(auction => {
            for (const key in auction.tags) {
                const value = auction.tags[key];
                if (!tagData[key]) {
                    tagData[key] = new Set();
                }
                tagData[key].add(value);
            }
        });
        return tagData;
    }

    $: tags = extractUniqueTags(auctions);
    $: filteredAuctions = searchFilteredAuctions.filter(item => tagFilteredAuctions.includes(item));

    const handleDeleteAuction = async (auctionId) => {
        const jwt = localStorage.getItem("token");

        try {
            const token = localStorage.getItem("token");

            console.log("Deleting auction with ID:", auctionId);
            console.log("Authorization token:", decodeJWT(token));

            const response = await fetch(`http://localhost:3000/admin/delete-auction/${auctionId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "token": jwt,
                }
            });

            console.log("Delete auction response:", response);

            if (response.ok) {
                // Refresh the auction list after deletion
                navigate("/auctions");
            } else {
                console.error("Failed to delete auction:", response.status, response.statusText);
                const errorResponse = await response.json();
                console.error("Error details:", errorResponse);
            }
        } catch (error) {
            console.error("Error deleting auction:", error);
        }
    };

    function decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const payload = JSON.parse(atob(base64));
        return payload;
    }

    const isJwtValid = () => {
        const token = localStorage.getItem('token');
        console.log(decodeJWT(token));
        if (token === null) {
            return false;
        }

        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Check if the token has not expired
            return !(decodedToken.exp && decodedToken.exp < currentTimestamp);
        } catch (error) {
            // If there is an error decoding or parsing the token, it's not valid
            return false;
        }
    }
</script>

<main>
    <h2>
        Welcome, <br>
        Buy stolen antiques right here!! <br>
    </h2>

    <div id="search-bar">
        <SearchBar {auctions} updateAuctions={updateSearchAuctions}/>
    </div>

    <div id="filters">
        <Filter {auctions} updateAuctions={updateTagAuctions} tagData={tags}/>
    </div>

    {#if isAdmin}
        <div id="add-auction-button">
            <a href="/addauction">Add Auction</a>
        </div>
    {/if}

    {#if filteredAuctions}
        <div id="auctions-container">
            {#each filteredAuctions as auction (auction.id)}
                <div class="auction-container">
                    <SmallAuction {auction} />
                </div>
            {/each}

        </div>
    {:else}
        <p>A critical error has occurred. Most likely the server is down. Please try again later. </p>
    {/if}
</main>

<style>
    @import url('https://fonts.googleapis.com/css?family=Poppins:700|Poppins:400');
    .primary-color {
        color: var(--primary);
    }

    #auctions-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin-top: 20px;
    }

    .auction-container {
        margin: 10px;
    }

    #add-auction-button {
        margin-top: 20px;
    }

    #add-auction-button a {
        background: darkgreen;
        color: #fff;
        padding: 10px 15px;
        text-decoration: none; /* Remove underline */
        border-radius: 5px;
        cursor: pointer;
        display: inline-block; /* Make it look like a button */
    }
</style>