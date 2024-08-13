function vec3_add_k(v, k) {
    return [v[0] + k, v[1] + k, v[2] + k];
}

function vec3_sub_k(v, k) {
    return [v[0] - k, v[1] - k, v[2] - k];
}

function vec3_mul_k(v, k) {
    return [v[0] * k, v[1] * k, v[2] * k];
}

function vec3_div_k(v, k) {
    return [v[0] / k, v[1] / k, v[2] / k];
}

function vec3_pow_k(v, k) {
    return [v[0] ** k, v[1] ** k, v[2] ** k];
}

function vec3_sqrt(v) {
    return [Math.sqrt(v[0]), Math.sqrt(v[1]), Math.sqrt(v[2])];
}

function vec3_add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function vec3_sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

function vec3_mul(v1, v2) {
    return [v1[0] * v2[0], v1[1] * v2[1], v1[2] * v2[2]];
}

function vec3_div(v1, v2) {
    return [v1[0] / v2[0], v1[1] / v2[1], v1[2] / v2[2]];
}

function vec3_norm(v) {
    const magnitude = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    return [v[0] / magnitude, v[1] / magnitude, v[2] / magnitude];
}

function vec3_dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

function vec3_cross(v1, v2) {
    return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    ];
}
