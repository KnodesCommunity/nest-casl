release_type="$( git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger \K(.* )?(?=release)' )"
if [ -z "${release_type}" ]; then
    exit 1
fi
echo "${release_type}"