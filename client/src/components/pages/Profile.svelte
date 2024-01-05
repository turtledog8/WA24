<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    // Replace 'API_BASE_URL' with your actual API base URL
    const API_BASE_URL = 'http://localhost:3000';

    // User details store
    const userDetails = writable(null);

    // Bids store
    const bids = writable(null);
    const auctions = writable(null);
    const groupedBids = writable(null); // Add a new store for grouped bids

    // Won auctions store
    const wonAuctions = writable(null);

    // Function to get the authentication token from localStorage
    const getToken = () => localStorage.getItem('token');

    // Extract user ID from navigation component
    let userId;

    export let active;
    export let isLoggedIn = false;
    export let isAdmin = false;
    export let id = "";

    const isJwtValid = () => {
        const token = localStorage.getItem('token');

        if (token === null) {
            return false;
        }

        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Check if the token has not expired
            if (decodedToken.exp && decodedToken.exp < currentTimestamp) {
                return false;
            }

            isAdmin = decodedToken.isAdmin;
            id = decodedToken.id;

            return true;
        } catch (error) {
            // If there is an error decoding or parsing the token, it's not valid
            return false;
        }
    }

    isLoggedIn = isJwtValid();

    onMount(async () => {
        // Use the user ID from the navigation component
        userId = id;

        try {
            const userDetailsResponse = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'token': getToken(),
                },
            });
            const userDetailsData = await userDetailsResponse.json();
            userDetails.set(userDetailsData);

            const bidsResponse = await fetch(`${API_BASE_URL}/user/bids/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'token': getToken(),
                },
            });
            const bidsData = await bidsResponse.json();

            if (bidsData && bidsData.bids) {
                bids.set(bidsData.bids);

                const auctionDetailsPromises = bidsData.bids.map(async (bid) => {
                    const auctionResponse = await fetch(`${API_BASE_URL}/auctions/${bid.auction}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'token': getToken(),
                        },
                    });
                    const auctionData = await auctionResponse.json();
                    return auctionData;
                });

                const auctionDetails = await Promise.all(auctionDetailsPromises);
                auctions.set(auctionDetails);

                // Group bids and auctions by auction name
                const groupedData = groupByAuctionName(bidsData.bids, auctionDetails);
                groupedBids.set(groupedData);
            } else {
                console.error('Unexpected data structure:', bidsData);
            }

            // Fetch won auctions separately
            const wonAuctionsResponse = await fetch(`${API_BASE_URL}/user/won-auctions/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'token': getToken(),
                },
            });
            const wonAuctionsData = await wonAuctionsResponse.json();
            wonAuctions.set(wonAuctionsData);
        } catch (error) {
            console.error('Error fetching user details, bids, and auction details:', error);
        }
    });

    const formatDate = (dateTimeString) => {
        const [datePart, timePart] = dateTimeString.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');

        // Months are zero-based in JavaScript Date constructor
        const formattedDate = new Date(year, month - 1, day, hours, minutes);

        return formattedDate.toLocaleString();
    };

    // Helper function to group bids and auctions by auction name
    const groupByAuctionName = (bids, auctions) => {
        const groupedData = {};

        bids.forEach((bid, index) => {
            const auctionName = auctions[index].item;

            if (!groupedData[auctionName]) {
                groupedData[auctionName] = [];
            }

            groupedData[auctionName].push({ bid, auction: auctions[index] });
        });

        return groupedData;
    };

    const removeBid = async (auctionId, bidDateTimeString) => {
        try {
            // Fetch user details to get the username
            const userDetailsResponse = await fetch(`${API_BASE_URL}/user/profile/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'token': getToken(),
                },
            });
            const userDetailsData = await userDetailsResponse.json();

            // Check if userDetailsData has the required fields (modify as needed)
            if (userDetailsData && userDetailsData.username) {
                // Ask for confirmation before removing the bid
                const confirmDeletion = window.confirm("Are you sure you want to remove this bid?");

                if (confirmDeletion) {
                    const response = await fetch(`${API_BASE_URL}/user/bid/remove`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'token': getToken(),
                        },
                        body: JSON.stringify({
                            username: userDetailsData.username, // Use the obtained username
                            auctionId,
                            bidDateTimeString,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        console.log('Bid removed successfully:', data.message);
                        // Refresh bid data after removal
                        refreshBidData();
                    } else {
                        console.error('Failed to remove bid:', data.message);
                    }
                }
            } else {
                console.error('User details do not contain the necessary fields');
            }
        } catch (error) {
            console.error('Error removing bid:', error);
        }
    };

    const refreshBidData = async () => {
        // Fetch updated bid data after removal
        const bidsResponse = await fetch(`${API_BASE_URL}/user/bids/${userId}`, {
            headers: {
                'Content-Type': 'application/json',
                'token': getToken(),
            },
        });

        const bidsData = await bidsResponse.json();

        if (bidsData && bidsData.bids) {
            bids.set(bidsData.bids);

            const auctionDetailsPromises = bidsData.bids.map(async (bid) => {
                const auctionResponse = await fetch(`${API_BASE_URL}/auctions/${bid.auction}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'token': getToken(),
                    },
                });
                const auctionData = await auctionResponse.json();
                return auctionData;
            });

            const auctionDetails = await Promise.all(auctionDetailsPromises);
            auctions.set(auctionDetails);

            // Group bids and auctions by auction name
            const groupedData = groupByAuctionName(bidsData.bids, auctionDetails);
            groupedBids.set(groupedData);
        } else {
            console.error('Unexpected data structure:', bidsData);
        }
    };

    $: console.log('User details:', $userDetails);
    $: console.log('Bids store content:', $bids);
    $: console.log('Auctions store content:', $auctions);
    $: console.log('Grouped bids content:', $groupedBids);
    $: console.log('Won auctions:', $wonAuctions);
</script>

<main>
    {#if $userDetails}
        <section>
            <h1>User Profile</h1>
            <p>Name: {$userDetails.firstName} {$userDetails.lastName}</p>
            <p>Email: {$userDetails.email}</p>
            <!-- Add other user details as needed -->
        </section>
    {/if}
    {#if $wonAuctions && $wonAuctions.length > 0}
        <section>
            <h2>Won Auctions</h2>
            {#each $wonAuctions as { auctionId, victor, bid, dateTimeString }}
                <div class="won-auction-container">
                    <p>Auction ID: {auctionId}</p>
                    <p>Winner: {victor}</p>
                    <p>Winning Bid: {bid}</p>
                    <p>Winning Date: {formatDate(dateTimeString)}</p>
                </div>
            {/each}
        </section>
    {/if}
    {#if $groupedBids}
        <section>
            <h2>Bid History</h2>
            {#each Object.entries($groupedBids) as [auctionTitle, bids] (auctionTitle)}
                <div class="auction-container" style="background-color: orangered;">
                    <h3>{auctionTitle}</h3>
                    {#each bids as { bid, auction }}
                        <div class="bid-container">
                            <p>Bid Amount: {bid.bid}</p>
                            <p>Date: {formatDate(bid.dateTimeString)}</p>
                            <p>
                                Auction Name:
                                <a href={`/auctions/${auction.id}`}>
                                    {auction.item}
                                </a>
                            </p>
                            <button on:click={() => removeBid(auction.id, bid.dateTimeString)}>Remove Bid</button>
                        </div>
                    {/each}
                </div>
            {/each}
        </section>
    {/if}


    {#if !$userDetails && !$groupedBids && !($wonAuctions && $wonAuctions.length > 0)}
        <p>Loading...</p>
    {/if}
</main>

<style>
    main {
        max-width: 800px;
        margin: auto;
        padding: 20px;
    }

    section {
        margin-bottom: 20px;
    }

    h1, h2, h3 {
        color: white;
    }

    .auction-container {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 20px;
    }

    .bid-container {
        border-top: 1px solid #ddd;
        margin-top: 10px;
        padding-top: 10px;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 10px;
    }

    a {
        color: blue; /* Customize the link color */
        text-decoration: underline;
        cursor: pointer;
    }

    button {
        margin-top: 10px;
        cursor: pointer;
    }
</style>
