if ! git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger \K(.* )?(?=release)'; then
    exit 1;
fi
release_type="$( git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger \K(.* )?(?=release)' )"
if [ -z "${release_type}" ]; then
    branch="$(git rev-parse --abbrev-ref HEAD)"
    if [ "${branch}" == 'develop' ]; then
        echo "next"
    else
        echo ""
    fi
else
    echo "${$re}"
fi