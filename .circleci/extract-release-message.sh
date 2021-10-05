tag="$(git log -1 HEAD --pretty=format:%s | sed 's/^ci(release): trigger v\(.*\)$/\1/')"
if [ -z "${tag}" ]; then
    exit 1
fi