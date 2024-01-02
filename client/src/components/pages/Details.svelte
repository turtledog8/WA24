<script>
    import { onMount, onDestroy } from 'svelte';

    export let id;
    export let auction = null;
    export let currentImageIndex = 0;
    export let isLoggedIn = false;
    export let bid = 1.00;
    export let errorMessage = "";
    export let countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 }; // Initialize countdown timer
    export let isAdmin = false; // Add isAdmin variable for checking admin status

    const findHighestBid = () => {
        if (auction && auction.bids && auction.bids.length > 0) {
            const bidEntries = Object.entries(auction.bids);
            bidEntries.sort((a, b) => b[1] - a[1]); // Sort by bid values in descending order
            return bidEntries[0]; // Get the last (highest) bid
        } else {
            return [null, 0]; // Return a default value when there are no bids
        }
    };

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

    function decodeJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace('-', '+').replace('_', '/');
        const payload = JSON.parse(atob(base64));
        return payload;
    }

    const calculateRemainingTime = () => {
        const now = new Date();
        const closingTime = new Date(auction.closingTime);
        const difference = closingTime - now;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds
        };
    };

    export const submitBid = async () => {
        console.log("Submitting bid:", bid);

        // Check if the user is authenticated
        if (!isLoggedIn) {
            errorMessage = "Please log in to place a bid.";
            return;
        }

        const numericBid = Number(bid);

        if (!Number.isSafeInteger(numericBid)) {
            errorMessage = "Input provided is not a number.";
            return;
        }

        if (numericBid <= findHighestBid()[1] + 1) {
            errorMessage = "Bid must be at least 1 euro higher than the last bid.";
            return;
        }

        const jwt = localStorage.getItem("token");

        // Check if the token is available
        if (!jwt) {
            errorMessage = "Authentication token missing. Please log in again.";
            return;
        }

        const user = JSON.parse(atob(jwt.split('.')[1]));

        const data = {
            "user": user, // Add user information to the data
            "auctionId": auction.id,
            "bid": numericBid,
        }

        try {
            const response = await fetch("http://localhost:3000/user/bid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": jwt,
                },
                body: JSON.stringify(data),
            });

            if (response.status === 200) {
                errorMessage = "";
                window.location.href = `/auctions/${id}`;
            } else {
                const responseJSON = await response.json();
                errorMessage = `Something went wrong when placing the bid with code ${response.status}: ` + responseJSON.message;
            }
        } catch (error) {
            console.log(error);
            errorMessage = "Something went wrong when placing the bid. Please try again later.";
        }
    }


    onMount(async () => {
        isLoggedIn = isJwtValid();
        try {
            const response = await fetch(`http://localhost:3000/auctions/${id}`, {
                method: "GET"
            });
            if (response.ok) {
                auction = await response.json();

                // Transform bids array here
                auction.bids = auction.bids.map(bid => ({
                    user: { username: bid.user ? bid.user.username : 'Unknown' },
                    bid: bid
                }));

            } else {
                console.error("Error fetching data:", response.status, response.statusText);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        const highestBid = findHighestBid();
        if (bid < highestBid[1]) {
            bid = highestBid[1];
        }

        // Check if the user is an admin
        const token = localStorage.getItem('token');
        const decodedToken = decodeJWT(token);
        isAdmin = decodedToken && decodedToken.isAdmin;

        countdown = calculateRemainingTime(); // Initialize countdown on component mount

        const interval = setInterval(() => {
            countdown = calculateRemainingTime(); // Update countdown every second
        }, 1000);

        onDestroy(() => {
            clearInterval(interval); // Clear the interval on component destruction
        });
    });

    const navigateTo = (index) => {
        currentImageIndex = (index + auction.images.length) % auction.images.length;
    }

    export const endAuction = async () => {
        const jwt = localStorage.getItem("token");

        try {
            console.log("Ending auction:", auction.id);

            const response = await fetch(`http://localhost:3000/admin/end-auction/${auction.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": jwt,
                }
            });

            console.log("ending auction response:", response);

            if (response.ok) {
                // Redirect or perform any necessary action after successful deletion
                console.log("Auction ended successfully");

            } else {
                console.error("Failed to end auction:", response.status, response.statusText);
                const errorResponse = await response.json();
                console.error("Error details:", errorResponse);
            }
        } catch (error) {
            console.error("Error end auction:", error);
        }
    };

    export const deleteAuction = async () => {
        const jwt = localStorage.getItem("token");

        try {
            console.log("Deleting auction:", auction.id);

            const response = await fetch(`http://localhost:3000/admin/delete-auction/${auction.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "token": jwt,
                }
            });

            console.log("Delete auction response:", response);

            if (response.ok) {
                // Redirect or perform any necessary action after successful deletion
                console.log("Auction deleted successfully");
                window.location.href = "/store";
            } else {
                console.error("Failed to delete auction:", response.status, response.statusText);
                const errorResponse = await response.json();
                console.error("Error details:", errorResponse);
            }
        } catch (error) {
            console.error("Error deleting auction:", error);
        }
    };

    const editAuction = async () => {

        try {
            console.log("Editing auction:", auction.id);
            window.location.href = `/edit-auction/${auction.id}`;
        } catch (error) {
            console.error("Error editing auction:", error);
        }
    };

    export { editAuction };
</script>

    <main>
        {#if auction === null}
            <p>Loading...</p>
        {:else}
            {#if auction.images && Array.isArray(auction.images)}
                <div class="left-field">
                    <div class="image-container">
                        <div class="image-nav left" on:click={() => navigateTo(currentImageIndex - 1)}>&#9664;</div>
                        <img src={auction.images[currentImageIndex]} alt="Auction Image" />
                        <div class="image-nav right" on:click={() => navigateTo(currentImageIndex + 1)}>&#9654;</div>
                        <div class="image-pagination">
                            {#each auction.images as image, index (image)}
                                <div class="pagination-dot {index === currentImageIndex ? 'active' : ''}" on:click={() => navigateTo(index)}></div>
                            {/each}
                        </div>
                    </div>
                    <div class="info-section">
                        <h1>{auction.item}</h1>
                        {#if auction.tags}
                            <div class="tags">
                                {#if typeof auction.tags === 'object'}
                                    {#each Object.entries(auction.tags) as [tag, value]}
                                        <div class="tag-box">
                                            <p><strong>{tag}:</strong> {value}</p>
                                        </div>
                                    {/each}
                                {:else if Array.isArray(auction.tags)}
                                    {#each auction.tags as tag, index}
                                        <div class="tag-box">
                                            <p><strong>{index}:</strong> {tag}</p>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        {/if}

                    </div>
                    {#if isAdmin}
                        <div class="info-section">
                            <button on:click={editAuction}>Edit Auction</button>
                            <button on:click={deleteAuction}>Delete Auction</button>
                            <button on:click={endAuction}>End Auction</button>

                        </div>
                    {/if}

                </div>
            {/if}
            <div class="middle-field">
                <div class="info-container">
                    <div class="middle-section">
                        <h1>Description</h1>
                        <p class="description">{auction.description}</p>
                    </div>
                </div>
            </div>
            <div class="right-field">
                <div class="info-section">
                    <h2>Bids</h2>
                    <div class="bids-container">
                        <ul>
                            {#if auction.bids.length > 0}
                                {#each auction.bids.slice().reverse() as { bid }, index}
                                    <li>
                                        <p> {bid.username.username}</p>
                                        <p>€{bid.bid}</p> <!-- Prepend euro sign here -->
                                        {#if index !== auction.bids.length - 1}
                                            <hr class="bid-divider" />
                                        {/if}
                                    </li>
                                {/each}
                            {:else}
                                <p>No bids yet.</p>
                            {/if}
                        </ul>
                    </div>
                </div>
                <div class="info-section">
                    {#if countdown.days > 0}
                        <p>Time Remaining: {countdown.days} days, {countdown.hours} hours, {countdown.minutes} minutes, {countdown.seconds} seconds</p>
                    {:else if countdown.hours > 0}
                        <p>Time Remaining: {countdown.hours} hours, {countdown.minutes} minutes, {countdown.seconds} seconds</p>
                    {:else if countdown.minutes > 0}
                        <p>Time Remaining: {countdown.minutes} minutes, {countdown.seconds} seconds</p>
                    {:else}
                        <p>Time Remaining: {countdown.seconds} seconds</p>
                    {/if}

                    {#if isLoggedIn}
                        <div class="error-message">
                            {#if errorMessage}
                                {errorMessage}
                            {/if}
                        </div>

                        <label for="bid">Your Bid (in euros):</label>
                        <input type="number" step="1" bind:value={bid} placeholder="Enter your bid in euros (e.g., 50.00)" id="bid"/>
                        <div class="submit-button-container">
                            <button class="submit-button" on:click={submitBid}>Submit Bid</button>
                        </div>

                    {:else}
                        <p><a href="/login">Log in</a> or <a href="/register">register</a> to place a bid.</p>
                    {/if}
                </div>
            </div>
        {/if}
    </main>

    <style>
        main {
            display: flex;
            gap: 20px;
            margin: 20px;
        }

        .left-field, .middle-field, .right-field {
            flex: 1;
        }

        .left-field {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-right: 20px;
        }

        .image-container {
            position: relative;
            text-align: center;
        }

        img {
            width: 30vw;
            height: auto;
        }

        .image-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            background: rgb(89, 89, 89, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
        }

        .image-nav.left {
            left: 0;
        }

        .image-nav.right {
            right: 0;
        }

        .image-pagination {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }

        .pagination-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgb(82, 82, 82);
            margin: 0 5px;
            transition: background 0.3s ease-in-out;
            cursor: pointer;
        }

        .pagination-dot.active {
            background: #ffffff;
        }

        .middle-field {
            display: flex;
            flex-direction: column;
            gap: 20px;
            flex-grow: 1;
            max-width: 800px;
        }

        .info-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            flex-grow: 1;
        }

        .info-section {
            flex-grow: 1;
        }

        h1, h2 {
            margin-bottom: 10px;
        }

        .description {
            color: darkgreen;
            max-width: 60vw;
            margin: 0 auto 0 auto;
        }

        .tags {
            display: flex;
            flex-wrap: wrap;
        }

        .tag-box {
            background: var(--accent);
            padding: 2px 5px 2px 5px;
            font-size: 12px;
            margin: 0 10px 10px 0;
        }

        .bids ul {
            padding: 0;
            list-style: none;
        }

        .bids li {
            margin-bottom: 5px;
        }

        .submit-button-container {
            text-align: center;
            margin-top: 20px;
        }

        #bid {
            background-color: var(--accent);
            max-width: 10vw;
            height: 20px;
        }

        .submit-button {
            border: none;
            border-radius: 20px;
            background: darkgreen;
            color: #fff;
            padding: 15px 20px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease-in-out;
        }

        .submit-button:hover {
            background: var(--accent);
        }

        input {
            border: none;
            background: none;
            color: var(--text);
            font-family: 'Poppins', sans-serif;
            font-weight: 400;
            outline: none;
            width: 100%;
        }

        input::placeholder {
            color: var(--accent);
        }
        .bids-container {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 10px;
        }

        .bids-container {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 10px;
        }

        .bids ul {
            padding: 0;
            list-style: none;
        }

        .bids li {
            margin-bottom: 10px; /* Adjust margin between bids */
        }

        .bid-divider {
            border: 1px solid #ccc; /* Adjust the border style as needed */
            margin: 10px 0; /* Adjust the margin around the divider line */
        }
    </style>
