const fs = require('fs');
const path = 'd:/PODOVI/SAJT/tmp/debug-tarkett.html';

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

            // Prepare the code for execution in Node
            // Mock window
            const preamble = "var window = {};\n";
            const postscript = "\nconsole.log(JSON.stringify(window.__NUXT__, null, 2));";

            const fullCode = preamble + jsCode + postscript;

            fs.writeFileSync('d:/PODOVI/SAJT/tools/run_nuxt_extraction_exec.js', fullCode);
            console.log("Created execution script.");

        } else {
            console.log("End script tag not found.");
        }
    } else {
        console.log("Start script tag not found.");
    }

} catch (e) {
    console.error("Error:", e);
}
