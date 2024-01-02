<script>
    import { onMount } from "svelte";

    function logout() {
        localStorage.removeItem("token");
        window.location.href = "/";
    }

    onMount(logout);
</script>

<main>
    <h1>Logging Out...</h1>
</main>
