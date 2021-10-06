if [ "$CI" != 'true' ]; then
    echo 'Should be ran only in CI'
    exit 1
fi
target_version="$( ! [ -z "$1" ] && echo "$1" || sh "$(dirname $(realpath "$0"))/extract-release-version.sh" )"
echo "Go for release ${target_version}"
npm run release:do -- --release-as ${target_version}