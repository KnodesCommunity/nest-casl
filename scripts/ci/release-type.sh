if ! git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger \K(.* )?(?=release)'; then
    exit 1;
fi
echo "$( git log -1 HEAD --pretty=format:%s | grep -oP '^ci\(release\): trigger \K(.* )?(?=release)' )"