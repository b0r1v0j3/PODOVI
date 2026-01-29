const fs = require('fs');
const path = process.argv[2];

if (!path) {
    console.error("Usage: node execute_nuxt_from_file.js <path>");
    process.exit(1);
}

try {
    let content = fs.readFileSync(path, 'utf8');
    const startMarker = '<script>window.__NUXT__=';
    const endMarker = '</script>';

    const startIndex = content.indexOf(startMarker);
    if (startIndex !== -1) {
        const scriptContent = content.substring(startIndex + '<script>'.length);
        const endIndex = scriptContent.indexOf(endMarker);

        if (endIndex !== -1) {
            let jsCode = scriptContent.substring(0, endIndex);

            const preamble = "var window = {};\n";
            const postscript = "\nconsole.log(JSON.stringify(window.__NUXT__, null, 2));";

            const fullCode = preamble + jsCode + postscript;

            // Execute using eval or writing to temp file
            // Better to write to temp file
            const tempExec = 'd:/PODOVI/SAJT/tmp/_exec_nuxt_temp.js';
            fs.writeFileSync(tempExec, fullCode);

            // We can't exec here directly, so we just save it.
            // The caller will run `node tmp/_exec_nuxt_temp.js`
            console.log("READY");

        } else {
            console.log("End script tag not found.");
        }
    } else {
        console.log("Start script tag not found.");
    }

} catch (e) {
    console.error("Error:", e);
}
