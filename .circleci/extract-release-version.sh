tag="$( git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger v\K(.*)$' )"
if [ -z "${tag}" ]; then
    exit 1
fi
echo "${tag}"