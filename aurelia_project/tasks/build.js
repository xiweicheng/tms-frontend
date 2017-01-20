import gulp from 'gulp';
import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';
import hash from './hash';
import replace from './replace';
import clean from './clean';
import { build } from 'aurelia-cli';
import project from '../aurelia.json';

export default gulp.series(
    clean,
    readProjectConfiguration,
    gulp.parallel(
        transpile,
        processMarkup,
        processCSS
    ),
    writeBundles,
    hash,
    replace
);

function readProjectConfiguration() {
    return build.src(project);
}

function writeBundles() {
    return build.dest();
}
