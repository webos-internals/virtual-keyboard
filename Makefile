WEBOS_VERSION=1.4.1
DOCTOR_DIR=/source/webos_doctors
PRE_ROOTFS=/common/source/pre_rootfs
PATCH_FILE=add-onscreen-keyboard.patch
ROOT=${DOCTOR_DIR}/root-1.4.1

.PHONY: all
all: stock apply

.PHONY: stock
stock: ${DOCTOR_DIR}/root-1.4.1

build/.built-stock: ${DOCTOR_DIR}/root-1.4.1
	@rsync -av ${DOCTOR_DIR}/root-1.4.1/ build/
	@touch $@

.PHONY: apply
apply: build/.patch-applied
build/.patch-applied:
	@mkdir -p
	@patch --no-backup-if-mismatch -p1 -d ${ROOT}/ -i ../add-onscreen-keyboard.patch
	@cp -a additional_files/* ${ROOT}/
	@touch $@

.PHONY: generate
generate: files
	@touch build/.patch-applied
	@rm -f add-onscreen-keyboard.patch
	@cd ${ROOT}
	#-@diff -Burp -x .patch-applied -x .built-stock root build > add-onscreen-keyboard.patch
	#@rm -rf additional_files
	#@for i in `cat files`; do \
		#if [ ! -e root/$$i ]; then \
			#mkdir -p additional_files/$$i; \
			#cp build/$$i additional_files/$$i; \
		#fi; \
	#done

.PHONY: files
files: stock
	@rm -f files
	#@diff -BurNp -x .patch-applied -x .built-stock root build | lsdiff --strip=1 | sed -e 's|^|/|' > files

.PHONY: sync
sync: files
	@rsync -av build/ $(PRE_ROOTFS)
	@cp files $(PRE_ROOTFS)

.PRECIOUS: ${DOCTOR_DIR}/root-1.4.1
${DOCTOR_DIR}/root-1.4.1: ${DOCTOR_DIR}/webosdoctor-1.4.1.jar
	@mkdir -p $@
	@if [ -e $< ]; then \
		unzip -p $< resources/webOS.tar | \
		tar -O -x -f - ./nova-cust-image-castle.rootfs.tar.gz | \
		tar -C $@ -m -z -x -f - ./usr; \
	fi
	@rm -f `find $@ -type l`
	echo "cd $@"
	@cd $@
	@git init
	@git add .
	@git commit -a -m"Initial Commit"
	@git tag stock

.PRECIOUS: ${DOCTOR_DIR}/webosdoctor-1.4.1.jar
${DOCTOR_DIR}/webosdoctor-1.4.1.jar:
	mkdir -p ${DOCTOR_DIR}
	curl -L -o $@ http://palm.cdnetworks.net/rom/pre/p1411r0d03312010/sr1ntp1411rod/webosdoctorp100ewwsprint.jar

clobber:
	@rm -rf build files
