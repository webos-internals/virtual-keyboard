DOCTOR_DIR=doctors
PRE_ROOTFS=/common/source/pre_rootfs
PATCH_FILE=add-onscreen-keyboard.patch

.PHONY: all
all: stock apply

.PHONY: stock
stock: build/.built-stock

build/.built-stock: root
	@rsync -av root/ build/
	@touch $@

.PHONY: apply
apply: build/.patch-applied
build/.patch-applied:
	@patch --no-backup-if-mismatch -p1 -d build -i ../add-onscreen-keyboard.patch
	@cp -a additional_files/* build/
	@touch $@

.PHONY: unapply
unapply:
	@if [ -d build ] && [ -f build/.patch-applied ]; then \
		patch --no-backup-if-mismatch -R -p1 -d build -i ../add-onscreen-keyboard.patch; \
		rm -f build/.patch-applied; \
	fi

.PHONY: generate
generate: files
	@touch build/.patch-applied
	@rm -f add-onscreen-keyboard.patch
	-@diff -Burp -x .patch-applied -x .built-stock root build > add-onscreen-keyboard.patch
	@rm -rf additional_files
	@for i in `cat files`; do \
		if [ ! -e root/$$i ]; then \
			mkdir -p additional_files/$$i; \
			cp build/$$i additional_files/$$i; \
		fi; \
	done

.PHONY: files
files: stock
	@rm -f files
	@diff -BurNp -x .patch-applied -x .built-stock root build | lsdiff --strip=1 | sed -e 's|^|/|' > files

.PHONY: sync
sync: files
	@rsync -av build/ $(PRE_ROOTFS)
	@cp files $(PRE_ROOTFS)

.PRECIOUS: root
root: ${DOCTOR_DIR}/webosdoctor.jar
	@mkdir -p root
	@if [ -e $< ]; then \
		unzip -p $< resources/webOS.tar | \
		tar -O -x -f - ./nova-cust-image-castle.rootfs.tar.gz | \
		tar -C root -m -z -x -f - ./usr; \
	fi
	@rm -f `find root -type l`
	@touch $@

.PRECIOUS: ${DOCTOR_DIR}/webosdoctor.jar
${DOCTOR_DIR}/webosdoctor.jar:
	mkdir -p ${DOCTOR_DIR}
	curl -L -o $@ http://palm.cdnetworks.net/rom/pre/p1411r0d03312010/sr1ntp1411rod/webosdoctorp100ewwsprint.jar

clobber:
	@rm -rf root build files
