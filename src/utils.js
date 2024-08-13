async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function is_close(a, b, epsilon = Number.EPSILON) {
    return Math.abs(a - b) < epsilon;
}
